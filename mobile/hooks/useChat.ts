import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { chatRepository } from '@/repositories';
import { joinChatRealtime } from '@/services/chatRealtime';
import type { Message } from '@/types/database';
import { generateClientId } from '@/utils/id';

import { useAnonymousAuth } from './useAnonymousAuth';

// Exported so useReconnect can invalidate every mounted chat query by
// prefix (['messages']) without needing to know which streamId(s) are
// currently active, and without duplicating this literal as a magic string.
export const CHAT_MESSAGES_QUERY_KEY_PREFIX = ['messages'] as const;

export function chatQueryKey(streamId: string) {
  return [...CHAT_MESSAGES_QUERY_KEY_PREFIX, streamId] as const;
}

// Stable reference for "no messages yet" — avoids a fresh [] on every
// render when query.data is still undefined, which matters for anything
// downstream that depends on messages by reference (e.g. useEffect/useMemo
// deps in ChatPanel).
const EMPTY_MESSAGES: Message[] = [];

function appendMessage(existing: Message[] | undefined, message: Message): Message[] {
  const current = existing ?? EMPTY_MESSAGES;
  // Prevents duplicates: a sent message arrives twice (the mutation's own
  // response, then again as a realtime echo of your own insert) — the
  // second arrival is a no-op here.
  if (current.some((item) => item.id === message.id)) return current;
  return [...current, message].sort((a, b) => a.seq - b.seq);
}

export interface UseChatResult {
  messages: Message[];
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
  const queryClient = useQueryClient();
  const queryKey = chatQueryKey(streamId);

  const query = useQuery({
    queryKey,
    queryFn: () => chatRepository.listByStream(streamId),
  });

  useEffect(() => {
    return joinChatRealtime(streamId, (message) => {
      queryClient.setQueryData<Message[]>(chatQueryKey(streamId), (existing) =>
        appendMessage(existing, message),
      );
    });
  }, [streamId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (!currentUserId) {
        throw new Error('useChat: cannot send without an active session');
      }
      return chatRepository.send({
        stream_id: streamId,
        sender_id: currentUserId,
        content,
        client_id: generateClientId(),
        client_created_at: new Date().toISOString(),
      });
    },
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(queryKey, (existing) => appendMessage(existing, message));
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
    messages: query.data ?? EMPTY_MESSAGES,
    currentUserId,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    sendMessage,
    isSending: sendMutation.isPending,
    sendError: sendMutation.isError,
  };
}
