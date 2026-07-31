import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';
import type { StartStreamInput, Stream, StreamWithCreator } from '@/types/database';

import { unwrap, unwrapNullable } from './_shared';

export interface StreamRepository {
  /** Live streams with their creator's profile embedded — see StreamWithCreator. */
  listLive(): Promise<StreamWithCreator[]>;
  listByCreator(creatorId: string): Promise<Stream[]>;
  /** Includes the creator's profile embedded — the Viewer screen needs a display name, not a raw creator_id. */
  getById(id: string): Promise<StreamWithCreator | null>;
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
    // Same creator join as listLive() — the Viewer screen renders the
    // creator's display name, not their raw id.
    const result = await supabase
      .from('streams')
      .select('*, creator:profiles!streams_creator_id_fkey(username, display_name, avatar_url)')
      .eq('id', id)
      .maybeSingle();
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
    const refetch = () => {
      // Refetch on any change rather than reconciling the change payload by
      // hand — simpler and correct at this data volume, and avoids subtle
      // ordering bugs from manually merging INSERT/UPDATE/DELETE events.
      // The .catch() matters: without it, a failed refetch (e.g. a
      // transient network error) was an unhandled promise rejection that
      // silently dropped the update — Browse would just never hear about
      // the change instead of retrying or surfacing anything.
      streamRepository
        .listLive()
        .then(onChange)
        .catch((error: unknown) => {
          console.error(
            '[streamRepository] Failed to refetch live streams after a realtime change',
            error,
          );
        });
    };

    // Postgres Changes has no replay/backfill: any INSERT/UPDATE/DELETE
    // that happens while this channel is disconnected (a dropped socket,
    // an app backgrounded long enough for the connection to be killed,
    // a transient Realtime-server-side blip — none of which necessarily
    // means the *device* ever went offline) is simply gone once the
    // channel reconnects. Rejoining alone does not catch Browse back up.
    // wasDisconnected tracks that so the moment this channel comes back
    // to SUBSCRIBED after having been in a bad state, one manual refetch
    // reconciles whatever was missed — independent of (and a safety net
    // alongside) useReconnect's broader device-network-transition flow.
    let wasDisconnected = false;

    const channel = supabase
      .channel('streams:list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streams' }, refetch)
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          wasDisconnected = true;
          // Logged (not silently ignored) so a subscription that never
          // reaches SUBSCRIBED — e.g. the streams table not actually being
          // in the Supabase project's realtime publication, or Realtime
          // disabled for the project — is visible instead of presenting as
          // "Browse just never updates" with no clue why.
          console.error(
            '[streamRepository] streams:list realtime subscription problem',
            status,
            error,
          );
          return;
        }
        if (status === 'SUBSCRIBED' && wasDisconnected) {
          wasDisconnected = false;
          refetch();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
