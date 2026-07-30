import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';
import type { StartStreamInput, Stream, StreamWithCreator } from '@/types/database';

import { unwrap, unwrapNullable } from './_shared';

export interface StreamRepository {
  /** Live streams with their creator's profile embedded — see StreamWithCreator. */
  listLive(): Promise<StreamWithCreator[]>;
  listByCreator(creatorId: string): Promise<Stream[]>;
  getById(id: string): Promise<Stream | null>;
  /** The creator's current live stream, if any — at most one can exist (streams_one_live_per_creator). */
  getLiveByCreator(creatorId: string): Promise<Stream | null>;
  start(input: StartStreamInput): Promise<Stream>;
  end(id: string): Promise<Stream>;
  /** Fires whenever the given stream's row changes (e.g. status: live -> ended). */
  subscribeToStream(id: string, onChange: (stream: Stream) => void): () => void;
  /** Fires with the fresh live-streams list whenever any stream changes. */
  subscribeToLiveStreams(onChange: (streams: StreamWithCreator[]) => void): () => void;
}

export const streamRepository: StreamRepository = {
  async listLive() {
    // Embeds the creator's profile via the FK (see migration:
    // streams_creator_id_fkey) instead of a separate per-card profile
    // fetch, which would be an N+1 query against the streams list.
    const result = await supabase
      .from('streams')
      .select('*, creator:profiles!streams_creator_id_fkey(username, display_name, avatar_url)')
      .eq('status', 'live')
      .order('started_at', { ascending: false });
    return unwrap(result);
  },

  async listByCreator(creatorId) {
    const result = await supabase
      .from('streams')
      .select('*')
      .eq('creator_id', creatorId)
      .order('started_at', { ascending: false });
    return unwrap(result);
  },

  async getById(id) {
    const result = await supabase.from('streams').select('*').eq('id', id).maybeSingle();
    return unwrapNullable(result);
  },

  async getLiveByCreator(creatorId) {
    const result = await supabase
      .from('streams')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'live')
      .maybeSingle();
    return unwrapNullable(result);
  },

  async start(input) {
    // status defaults to 'live' at the database level (see migration) —
    // deliberately not settable here, starting a stream always means going live.
    const result = await supabase.from('streams').insert(input).select().single();
    console.log(result.data);
    console.log(result.error);
    return unwrap(result);
  },

  async end(id) {
    const result = await supabase
      .from('streams')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return unwrap(result);
  },

  subscribeToStream(id, onChange) {
    const channel = supabase
      .channel(`streams:id=eq.${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'streams', filter: `id=eq.${id}` },
        (payload: RealtimePostgresChangesPayload<Stream>) => {
          if (payload.new && 'id' in payload.new) {
            onChange(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToLiveStreams(onChange) {
    const channel = supabase
      .channel('streams:list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streams' }, () => {
        // Refetch on any change rather than reconciling the change payload by
        // hand — simpler and correct at this data volume, and avoids subtle
        // ordering bugs from manually merging INSERT/UPDATE/DELETE events.
        void streamRepository.listLive().then(onChange);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
