import { streamRepository } from '@/repositories';
import type { Stream, StreamWithCreator } from '@/types/database';

const LEAVE_GRACE_MS = 1000;

// Same reasoning as services/presence.ts: supabase.channel(topic) dedupes
// by topic name internally (realtime-js returns the existing channel for a
// topic it already knows about instead of creating a new one), and
// untrack()/removeChannel() are real network round trips, not
// instantaneous. Without the grace period below, a rapid leave (last
// listener unmounts) immediately followed by a rejoin for the same topic —
// e.g. React StrictMode's dev-mode double-invoke of an effect (mount,
// cleanup, mount again) — deletes the registry entry and reopens a
// subscription *while the previous one's removal is still in flight*.
// realtime-js then hands back that same, not-yet-torn-down channel object
// instead of a fresh one, and calling .on() on an already-subscribed
// channel throws: "cannot add `postgres_changes` callbacks ... after
// `subscribe()`". 'streams:list' is a single, fixed topic name (not
// parameterized by id), so this is hit on essentially every dev-mode
// mount — exactly the reported bug. Deferring teardown and cancelling it
// on a rejoin avoids ever racing a create against a not-yet-finished
// remove.

// ---------------------------------------------------------------------------
// Live streams list ("streams:list" — a single, unkeyed topic, at most one
// underlying subscription for the whole app)
// ---------------------------------------------------------------------------

type StreamsListListener = (streams: StreamWithCreator[]) => void;

interface StreamsListEntry {
  listeners: Set<StreamsListListener>;
  leaveRepositorySubscription: () => void;
  teardownTimer: ReturnType<typeof setTimeout> | null;
}

let listEntry: StreamsListEntry | null = null;

/**
 * Joins the shared "live streams list changed" stream. Every caller shares
 * one underlying subscription — it's opened on the first join and only
 * torn down once the last caller leaves and stays gone for LEAVE_GRACE_MS.
 *
 * Returns a leave function; call it from a useEffect cleanup.
 */
export function joinLiveStreamsRealtime(onChange: StreamsListListener): () => void {
  if (listEntry?.teardownTimer) {
    // A previous last-listener-left teardown was scheduled but hasn't run
    // yet — this is a rejoin within the grace period, so reuse the
    // still-live channel instead of racing a fresh one against its
    // in-flight removal.
    clearTimeout(listEntry.teardownTimer);
    listEntry.teardownTimer = null;
  }

  if (!listEntry) {
    const listeners = new Set<StreamsListListener>();
    const leaveRepositorySubscription = streamRepository.subscribeToLiveStreams((streams) => {
      for (const listener of listeners) {
        listener(streams);
      }
    });
    listEntry = { listeners, leaveRepositorySubscription, teardownTimer: null };
  }

  listEntry.listeners.add(onChange);

  return () => {
    if (!listEntry) return;
    const current = listEntry;

    current.listeners.delete(onChange);
    if (current.listeners.size === 0 && current.teardownTimer === null) {
      current.teardownTimer = setTimeout(() => {
        // Still nobody listening after the grace period — genuinely done.
        if (listEntry === current && current.listeners.size === 0) {
          listEntry = null;
          current.leaveRepositorySubscription();
        }
      }, LEAVE_GRACE_MS);
    }
  };
}

// ---------------------------------------------------------------------------
// Single stream's row changes ("streams:id=eq.<id>" — keyed by stream id)
// ---------------------------------------------------------------------------

type StreamListener = (stream: Stream) => void;

interface StreamEntry {
  listeners: Set<StreamListener>;
  leaveRepositorySubscription: () => void;
  teardownTimer: ReturnType<typeof setTimeout> | null;
}

const streamEntries = new Map<string, StreamEntry>();

/**
 * Joins the shared "this stream's row changed" stream for a stream id.
 * Multiple callers for the same streamId share one underlying
 * subscription — it's opened on the first join and only torn down once
 * the last caller leaves and stays gone for LEAVE_GRACE_MS.
 *
 * Returns a leave function; call it from a useEffect cleanup.
 */
export function joinStreamRealtime(streamId: string, onChange: StreamListener): () => void {
  let entry = streamEntries.get(streamId);

  if (entry?.teardownTimer) {
    clearTimeout(entry.teardownTimer);
    entry.teardownTimer = null;
  }

  if (!entry) {
    const listeners = new Set<StreamListener>();
    const leaveRepositorySubscription = streamRepository.subscribeToStream(streamId, (stream) => {
      for (const listener of listeners) {
        listener(stream);
      }
    });
    entry = { listeners, leaveRepositorySubscription, teardownTimer: null };
    streamEntries.set(streamId, entry);
  }

  entry.listeners.add(onChange);

  return () => {
    const current = streamEntries.get(streamId);
    if (!current) return;

    current.listeners.delete(onChange);
    if (current.listeners.size === 0 && current.teardownTimer === null) {
      current.teardownTimer = setTimeout(() => {
        if (streamEntries.get(streamId) === current && current.listeners.size === 0) {
          streamEntries.delete(streamId);
          current.leaveRepositorySubscription();
        }
      }, LEAVE_GRACE_MS);
    }
  };
}
