import { chatRepository } from '@/repositories';
import type { Message } from '@/types/database';

type MessageListener = (message: Message) => void;

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
      for (const listener of listeners) {
        listener(message);
      }
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
