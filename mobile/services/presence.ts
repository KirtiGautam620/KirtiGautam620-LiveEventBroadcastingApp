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
  // Set when the last listener leaves; cleared (and the teardown skipped)
  // if a new listener joins before it fires — see joinPresence() below.
  teardownTimer: ReturnType<typeof setTimeout> | null;
}

// One entry per stream, shared by every joinPresence() caller for that
// stream id (e.g. a creator viewing their own just-started stream — Creator
// screen + the pushed Viewer screen — both mounted at once share a single
// channel instead of each opening a duplicate one).
//
// This also has to coexist with realtime-js's OWN internal behavior:
// supabase.channel(topic) dedupes by topic name itself (RealtimeClient
// returns the existing RealtimeChannel for a topic it already knows about
// instead of creating a new one). That's fine when this registry's entry
// is still valid — but untrack()/removeChannel() are real network round
// trips, not instantaneous. Without the grace period below, a rapid leave
// (last listener unmounts) immediately followed by a rejoin (a new
// component mounts for the same stream, e.g. during a fast
// navigation/remount) would delete the registry entry and call
// createEntry() again *while the old channel's removal is still in
// flight* — realtime-js would then hand back that same, half-torn-down
// channel object instead of a fresh one, and registering new
// presence/subscribe callbacks on it throws ("cannot add `presence`
// callbacks ... after `subscribe()`"), silently breaking presence tracking
// for that stream. Deferring teardown and cancelling it on a same-stream
// rejoin avoids ever racing a create against a not-yet-finished remove.
const entries = new Map<string, PresenceEntry>();

const LEAVE_GRACE_MS = 1000;

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
    teardownTimer: null,
  };

  channel.on('presence', { event: 'sync' }, () => {
    // sync always hands back the full, authoritative current state, so the
    // count is derived fresh each time rather than accumulated from
    // individual join/leave events, which can drift if one is ever missed.
    // presenceState() is keyed by the presence `key` this channel was
    // configured with above — that key is always the auth user id, so
    // this is already a count of unique users, not raw presence entries
    // (a user with more than one connection/meta under their own key
    // still only contributes one key).
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
 * last caller leaves and stays gone for LEAVE_GRACE_MS.
 *
 * Returns a leave function; call it from a useEffect cleanup. Untracking
 * and removing the channel only actually happens once every caller for
 * that streamId has left and no new one rejoined within the grace period.
 */
export function joinPresence(
  streamId: string,
  userId: string,
  onStateChange: PresenceListener,
): () => void {
  let entry = entries.get(streamId);

  if (entry?.teardownTimer) {
    // A previous last-listener-left teardown was scheduled but hasn't run
    // yet — this is a rejoin within the grace period, so reuse the
    // still-live channel instead of racing a fresh one against its
    // in-flight removal.
    clearTimeout(entry.teardownTimer);
    entry.teardownTimer = null;
  }

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
    if (current.listeners.size === 0 && current.teardownTimer === null) {
      current.teardownTimer = setTimeout(() => {
        // Still nobody listening after the grace period — genuinely done.
        // Re-check identity + listener count rather than trusting the
        // closure: a rejoin could have cancelled this timer already, but
        // guarding here too is cheap insurance against any future change
        // to this function's control flow.
        if (entries.get(streamId) === current && current.listeners.size === 0) {
          entries.delete(streamId);
          void current.channel.untrack();
          void supabase.removeChannel(current.channel);
        }
      }, LEAVE_GRACE_MS);
    }
  };
}
