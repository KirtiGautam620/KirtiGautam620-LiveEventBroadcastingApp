import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/supabase/client';

export interface PresenceState {
  viewerCount: number;
  isConnected: boolean;
}

interface PresencePayload {
  user_id: string;
  online_at: string;
}

type PresenceListener = (state: PresenceState) => void;

interface PresenceEntry {
  channel: RealtimeChannel;
  listeners: Set<PresenceListener>;
  state: PresenceState;
}

// One entry per stream, shared by every joinPresence() caller for that
// stream id. supabase.channel(topic) does not dedupe by topic name — two
// independent calls for the same "stream:<id>" topic would open two
// separate socket subscriptions. This registry is what makes e.g. a
// creator viewing their own just-started stream (Creator screen + the
// pushed Viewer screen, both mounted at once) share a single channel
// instead of each opening a duplicate one.
const entries = new Map<string, PresenceEntry>();

function notify(entry: PresenceEntry): void {
  for (const listener of entry.listeners) {
    listener(entry.state);
  }
}

function createEntry(streamId: string, userId: string): PresenceEntry {
  const channel = supabase.channel(`stream:${streamId}`, {
    config: { presence: { key: userId } },
  });

  const entry: PresenceEntry = {
    channel,
    listeners: new Set(),
    state: { viewerCount: 0, isConnected: false },
  };

  channel.on('presence', { event: 'sync' }, () => {
    // sync always hands back the full, authoritative current state, so the
    // count is derived fresh each time rather than accumulated from
    // individual join/leave events, which can drift if one is ever missed.
    const state = channel.presenceState<PresencePayload>();
    entry.state = { ...entry.state, viewerCount: Object.keys(state).length };
    notify(entry);
  });

  channel.subscribe((status) => {
    const isConnected = status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED;
    entry.state = { ...entry.state, isConnected };

    if (isConnected) {
      // Presence is scoped to this specific realtime connection, not the
      // user account — a dropped-and-restored connection rejoins as a
      // fresh presence session server-side. Re-tracking on every
      // successful (re)subscribe, not just the first one, is what makes a
      // reconnect correctly restore this viewer in the count instead of
      // silently dropping them.
      const payload: PresencePayload = { user_id: userId, online_at: new Date().toISOString() };
      void channel.track(payload);
    }

    notify(entry);
  });

  return entry;
}

/**
 * Joins the presence channel for a stream, tracking the given user as a
 * viewer. Multiple callers for the same streamId share one underlying
 * channel — it's created on the first join and only torn down once the
 * last caller leaves.
 *
 * Returns a leave function; call it from a useEffect cleanup. Untracking
 * and removing the channel only actually happens once every caller for
 * that streamId has left.
 */
export function joinPresence(
  streamId: string,
  userId: string,
  onStateChange: PresenceListener,
): () => void {
  let entry = entries.get(streamId);
  if (!entry) {
    entry = createEntry(streamId, userId);
    entries.set(streamId, entry);
  }

  entry.listeners.add(onStateChange);
  onStateChange(entry.state);

  return () => {
    const current = entries.get(streamId);
    if (!current) return;

    current.listeners.delete(onStateChange);
    if (current.listeners.size === 0) {
      entries.delete(streamId);
      void current.channel.untrack();
      void supabase.removeChannel(current.channel);
    }
  };
}
