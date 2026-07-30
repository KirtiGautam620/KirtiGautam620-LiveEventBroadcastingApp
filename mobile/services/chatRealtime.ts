import { chatRepository, profileRepository } from '@/repositories';
import type { MessageWithSender } from '@/types/database';

type MessageListener = (message: MessageWithSender) => void;

interface ChatRealtimeEntry {
  leaveRepositorySubscription: () => void;
  listeners: Set<MessageListener>;
}

// One entry (one underlying postgres_changes subscription, via
// ChatRepository.subscribeToStream) per stream, shared by every
// joinChatRealtime() caller for that streamId. Same reasoning as
// services/presence.ts: a creator watching their own stream can have both
// the Creator and Viewer screens mounted at once, and each shouldn't open
// its own duplicate subscription for the same stream's messages.
const entries = new Map<string, ChatRealtimeEntry>();

// postgres_changes INSERT payloads only carry raw `messages` row columns —
// Realtime can't broadcast a join. This cache (keyed by profile id, shared
// process-wide, not per-stream) is what lets a realtime message's sender
// name be resolved without a fetch on every single message: it's primed
// from every already-joined MessageWithSender the app has seen (chat
// history, a successful send — see useChat.ts), and only ever falls back
// to a real fetch the first time this session sees a sender nothing has
// resolved yet.
type SenderProfile = MessageWithSender['sender'];
const senderProfileCache = new Map<string, SenderProfile>();

/** Called from useChat.ts to warm the cache from data already joined by the repository. */
export function primeSenderProfile(senderId: string, sender: SenderProfile): void {
  senderProfileCache.set(senderId, sender);
}

async function resolveSenderProfile(senderId: string | null): Promise<SenderProfile> {
  if (!senderId) return null;
  const cached = senderProfileCache.get(senderId);
  if (cached !== undefined) return cached;

  const profile = await profileRepository.getById(senderId);
  const sender: SenderProfile = profile
    ? {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      }
    : null;
  senderProfileCache.set(senderId, sender);
  return sender;
}

/**
 * Joins the shared "new messages" stream for a stream id. Multiple callers
 * for the same streamId share one underlying subscription — it's opened on
 * the first join and only torn down once the last caller leaves.
 *
 * Returns a leave function; call it from a useEffect cleanup.
 */
export function joinChatRealtime(streamId: string, onMessage: MessageListener): () => void {
  let entry = entries.get(streamId);
  if (!entry) {
    const listeners = new Set<MessageListener>();
    const leaveRepositorySubscription = chatRepository.subscribeToStream(streamId, (message) => {
      // Fire-and-forget: the underlying postgres_changes callback isn't
      // async-aware. Cache hits (the common case — see the comment above)
      // resolve on the same microtask tick, so this adds no perceptible
      // delay for senders the app has already seen.
      void resolveSenderProfile(message.sender_id).then((sender) => {
        const enriched: MessageWithSender = { ...message, sender };
        for (const listener of listeners) {
          listener(enriched);
        }
      });
    });
    entry = { leaveRepositorySubscription, listeners };
    entries.set(streamId, entry);
  }

  entry.listeners.add(onMessage);

  return () => {
    const current = entries.get(streamId);
    if (!current) return;

    current.listeners.delete(onMessage);
    if (current.listeners.size === 0) {
      entries.delete(streamId);
      current.leaveRepositorySubscription();
    }
  };
}
