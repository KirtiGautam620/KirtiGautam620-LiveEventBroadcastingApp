import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { CHAT_MESSAGES_QUERY_KEY_PREFIX } from '@/hooks/useChat';
import { reconnectRealtime } from '@/services/realtimeConnection';
import { syncPendingMessages } from '@/services/syncEngine';

import { useNetworkStatus } from './useNetworkStatus';

const DEBOUNCE_MS = 1000;

export interface UseReconnectResult {
  isOnline: boolean;
  isReconnecting: boolean;
}

// Runs the reconnect flow whenever the device transitions from offline to
// online: reconnect realtime, drain the offline queue, then refetch chat.
// This is global, stateless-per-screen work — mount it once near the app
// root (see app/_layout.tsx), not per screen.
export function useReconnect(): UseReconnectResult {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const wasOnlineRef = useRef(isOnline);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;

    // Only an offline -> online transition triggers a reconnect. This is
    // what "ignore reconnect if already online" means in practice: no
    // transition at all, and a redundant "online" event while already
    // online, both fall through here without doing anything.
    if (!isOnline || wasOnline) {
      return;
    }

    // Debounce: a flapping connection re-triggers this effect repeatedly,
    // clearing and rescheduling the timer each time, so only a stable
    // offline -> online transition actually fires the flow.
    const timer = setTimeout(() => {
      if (isRunningRef.current) return; // never run two reconnect flows at once
      isRunningRef.current = true;
      setIsReconnecting(true);

      void (async () => {
        try {
          // 1. Reconnect Supabase Realtime. This also makes every existing
          // channel (chat + presence) rejoin automatically, which is what
          // covers "5. resume realtime listeners" — no per-hook
          // resubscribe logic needed.
          await reconnectRealtime();
          // 2 + 3. Drain the offline queue and wait for it to finish.
          await syncPendingMessages();
          // 4. Refetch latest chat messages for whichever chat screen(s)
          // are currently mounted.
          await queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY_PREFIX });
        } finally {
          isRunningRef.current = false;
          setIsReconnecting(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isOnline, queryClient]);

  return { isOnline, isReconnecting };
}
