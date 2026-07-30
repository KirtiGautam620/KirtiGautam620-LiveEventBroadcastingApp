import { useEffect, useState } from 'react';

import { joinPresence, type PresenceState } from '@/services/presence';

import { useAnonymousAuth } from './useAnonymousAuth';

const INITIAL_STATE: PresenceState = { viewerCount: 0, isConnected: false };

// streamId is nullable so this can be called unconditionally (Rules of
// Hooks) even before a real stream id exists yet — e.g. Creator calls this
// above its idle/live branch, where there's no active stream until one is
// started. Passing null simply skips joining.
export function usePresence(streamId: string | null): PresenceState {
  const { session } = useAnonymousAuth();
  const userId = session?.user.id;
  const [state, setState] = useState<PresenceState>(INITIAL_STATE);

  useEffect(() => {
    if (!streamId || !userId) {
      setState(INITIAL_STATE);
      return;
    }
    return joinPresence(streamId, userId, setState);
  }, [streamId, userId]);

  return state;
}
