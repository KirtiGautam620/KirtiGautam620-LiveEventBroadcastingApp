import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';
import type { Message, MessageWithSender, SendMessageInput } from '@/types/database';

import { unwrap } from './_shared';

// Reused by both listByStream() and send() so a message's sender name never
// needs a separate per-message fetch — see MessageWithSender.
const SENDER_SELECT =
  '*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)';

export interface ChatRepository {
  /** Most recent `limit` messages for the stream, in chronological (seq ascending) order. */
  listByStream(streamId: string, limit?: number): Promise<MessageWithSender[]>;
  /**
   * Upserts on (stream_id, sender_id, client_id): safe to call again with the
   * same client_id after a failed/uncertain send (e.g. offline retry) — the
   * retry lands as a no-op instead of a duplicate message.
   */
  send(input: SendMessageInput): Promise<MessageWithSender>;
  /**
   * Fires for each new message sent to the stream after subscribing.
   * Typically consumed via services/chatRealtime.ts, which shares one
   * subscription per streamId across multiple callers, rather than calling
   * this directly from more than one place for the same stream.
   */
  subscribeToStream(streamId: string, onMessage: (message: Message) => void): () => void;
}

export const chatRepository: ChatRepository = {
  async listByStream(streamId, limit = 200) {
    // Fetch the most recent `limit` by seq descending, then reverse to
    // chronological order. Ordering ascending-with-a-limit would instead
    // return the OLDEST messages once a stream has more than `limit` of
    // them — never showing recent chat history.
    const result = await supabase
      .from('messages')
      .select(SENDER_SELECT)
      .eq('stream_id', streamId)
      .order('seq', { ascending: false })
      .limit(limit);
    return unwrap(result).reverse();
  },

  async send(input) {
    const result = await supabase
      .from('messages')
      .upsert(input, { onConflict: 'stream_id,sender_id,client_id' })
      .select(SENDER_SELECT)
      .single();
    return unwrap(result);
  },

  subscribeToStream(streamId, onMessage) {
    const channel = supabase
      .channel(`messages:stream_id=eq.${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.new && 'id' in payload.new) {
            onMessage(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
