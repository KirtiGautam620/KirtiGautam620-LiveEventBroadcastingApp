import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';
import type { Message, SendMessageInput } from '@/types/database';

import { unwrap } from './_shared';

export interface ChatRepository {
  listByStream(streamId: string, limit?: number): Promise<Message[]>;
  /**
   * Upserts on (stream_id, sender_id, client_id): safe to call again with the
   * same client_id after a failed/uncertain send (e.g. offline retry) — the
   * retry lands as a no-op instead of a duplicate message.
   */
  send(input: SendMessageInput): Promise<Message>;
  /** Fires for each new message sent to the stream after subscribing. */
  subscribeToStream(streamId: string, onMessage: (message: Message) => void): () => void;
}

export const chatRepository: ChatRepository = {
  async listByStream(streamId, limit = 200) {
    // Ordered by seq (authoritative, server-assigned order), not
    // client_created_at — see migration for why.
    const result = await supabase
      .from('messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('seq', { ascending: true })
      .limit(limit);
    return unwrap(result);
  },

  async send(input) {
    const result = await supabase
      .from('messages')
      .upsert(input, { onConflict: 'stream_id,sender_id,client_id' })
      .select()
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
