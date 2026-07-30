import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { chatQueueRepository, type PendingMessage } from '@/database/chatQueue.repository';
import { chatRepository } from '@/repositories';
import { joinChatRealtime, primeSenderProfile } from '@/services/chatRealtime';
import type { MessageWithSender } from '@/types/database';
import { generateClientId } from '@/utils/id';

import { useAnonymousAuth } from './useAnonymousAuth';
import { useNetworkStatus } from './useNetworkStatus';

// Exported so useReconnect can invalidate every mounted chat query by
// prefix (['messages']) without needing to know which streamId(s) are
// currently active, and without duplicating this literal as a magic string.
export const CHAT_MESSAGES_QUERY_KEY_PREFIX = ['messages'] as const;

export function chatQueryKey(streamId: string) {
  return [...CHAT_MESSAGES_QUERY_KEY_PREFIX, streamId] as const;
}

// Same prefix-invalidation reasoning as CHAT_MESSAGES_QUERY_KEY_PREFIX,
// for the locally-queued (offline, not yet synced) side of the chat.
export const PENDING_MESSAGES_QUERY_KEY_PREFIX = ['pendingMessages'] as const;

export function pendingMessagesQueryKey(streamId: string) {
  return [...PENDING_MESSAGES_QUERY_KEY_PREFIX, streamId] as const;
}

// Stable reference for "no messages yet" — avoids a fresh [] on every
// render when query.data is still undefined, which matters for anything
// downstream that depends on messages by reference (e.g. useEffect/useMemo
// deps in ChatPanel).
const EMPTY_MESSAGES: MessageWithSender[] = [];
const EMPTY_PENDING: PendingMessage[] = [];

function appendMessage(
  existing: MessageWithSender[] | undefined,
  message: MessageWithSender,
): MessageWithSender[] {
  const current = existing ?? EMPTY_MESSAGES;
  // Prevents duplicates: a sent message arrives twice (the mutation's own
  // response, then again as a realtime echo of your own insert) — the
  // second arrival is a no-op here.
  if (current.some((item) => item.id === message.id)) return current;
  return [...current, message].sort((a, b) => a.seq - b.seq);
}

// A message the UI can render is either a server-confirmed row or a
// locally-queued one still waiting to sync. `pending` distinguishes them;
// everything downstream (ChatPanel, ChatMessageBubble, LiveChatOverlay)
// renders both through this one shape rather than two separate lists.
export type ChatDisplayMessage = MessageWithSender & { pending?: boolean };

function toDisplayMessage(pending: PendingMessage): ChatDisplayMessage {
  return {
    id: `pending-${pending.id}`,
    // Never used for ordering (see the concatenation in `messages` below,
    // not a re-sort) — just needs to satisfy Message's shape.
    seq: -pending.id,
    stream_id: pending.stream_id,
    sender_id: pending.sender_id,
    content: pending.content,
    client_id: pending.client_id,
    client_created_at: pending.client_created_at,
    created_at: pending.created_at,
    // No profile join for a not-yet-synced local row — the UI falls back
    // to "You" (it's always the current user's own message) or "Creator".
    sender: null,
    pending: true,
  };
}

type SendResult =
  { kind: 'sent'; message: MessageWithSender } | { kind: 'queued'; pending: PendingMessage };

export interface UseChatResult {
  messages: ChatDisplayMessage[];
  currentUserId: string | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
  sendMessage: (content: string) => void;
  isSending: boolean;
  sendError: boolean;
}

export function useChat(streamId: string): UseChatResult {
  const { session } = useAnonymousAuth();
  const currentUserId = session?.user.id ?? null;
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const queryKey = chatQueryKey(streamId);

  const query = useQuery({
    queryKey,
    queryFn: () => chatRepository.listByStream(streamId),
  });

  // Reads straight from SQLite, filtered to this stream. This is what
  // makes a still-queued message visible immediately after an app restart
  // (the row was never lost — it's on disk — this just surfaces it), and
  // it's re-read whenever useReconnect invalidates this prefix after a
  // sync pass removes now-synced rows.
  const pendingQuery = useQuery({
    queryKey: pendingMessagesQueryKey(streamId),
    queryFn: async () => {
      const pending = await chatQueueRepository.getPendingMessages();
      return pending.filter((message) => message.stream_id === streamId);
    },
  });

  useEffect(() => {
    return joinChatRealtime(streamId, (message) => {
      queryClient.setQueryData<MessageWithSender[]>(chatQueryKey(streamId), (existing) =>
        appendMessage(existing, message),
      );
    });
  }, [streamId, queryClient]);

  const serverMessages = query.data ?? EMPTY_MESSAGES;
  const pendingMessages = pendingQuery.data ?? EMPTY_PENDING;

  // Warms the shared sender-profile cache (services/chatRealtime.ts) from
  // every join this hook has already fetched, so a realtime message from a
  // sender already seen in history resolves without a fallback fetch.
  useEffect(() => {
    for (const message of serverMessages) {
      if (message.sender_id && message.sender) {
        primeSenderProfile(message.sender_id, message.sender);
      }
    }
  }, [serverMessages]);

  const messages = useMemo<ChatDisplayMessage[]>(() => {
    // A pending row can still be present locally for a moment after its
    // synced counterpart shows up via realtime or a refetch — the
    // pending-queue query hasn't necessarily been invalidated yet.
    // Excluding by client_id (not just relying on timing) is what actually
    // prevents a visible duplicate once syncPendingMessages() succeeds.
    const syncedClientIds = new Set(serverMessages.map((message) => message.client_id));
    const visiblePending = pendingMessages.filter(
      (message) => !syncedClientIds.has(message.client_id),
    );
    // Pending rows have no real seq yet, so they always belong after every
    // known server message rather than being re-sorted into that list.
    return [...serverMessages, ...visiblePending.map(toDisplayMessage)];
  }, [serverMessages, pendingMessages]);

  const sendMutation = useMutation<SendResult, Error, string>({
    mutationFn: async (content) => {
      if (!currentUserId) {
        throw new Error('useChat: cannot send without an active session');
      }
      const clientId = generateClientId();
      const clientCreatedAt = new Date().toISOString();

      if (!isOnline) {
        // Offline: queue locally, no network request. services/syncEngine.ts
        // drains this once connectivity returns (see useReconnect) — same
        // client_id-based idempotency the online path already relies on.
        const pending = await chatQueueRepository.enqueueMessage({
          stream_id: streamId,
          sender_id: currentUserId,
          client_id: clientId,
          content,
          client_created_at: clientCreatedAt,
        });
        return { kind: 'queued', pending };
      }

      const message = await chatRepository.send({
        stream_id: streamId,
        sender_id: currentUserId,
        content,
        client_id: clientId,
        client_created_at: clientCreatedAt,
      });
      return { kind: 'sent', message };
    },
    onSuccess: (result) => {
      if (result.kind === 'sent') {
        queryClient.setQueryData<MessageWithSender[]>(queryKey, (existing) =>
          appendMessage(existing, result.message),
        );
        return;
      }
      queryClient.setQueryData<PendingMessage[]>(pendingMessagesQueryKey(streamId), (existing) => [
        ...(existing ?? EMPTY_PENDING),
        result.pending,
      ]);
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !currentUserId) return;
      sendMutation.mutate(trimmed);
    },
    [currentUserId, sendMutation],
  );

  return {
    messages,
    currentUserId,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    sendMessage,
    isSending: sendMutation.isPending,
    sendError: sendMutation.isError,
  };
}
