import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
}

function deriveIsOnline(state: NetInfoState): boolean {
  return state.isConnected === true;
}

// Optimistic default: NetInfo's listener fires once with the real state
// shortly after subscribing, but assuming online until then avoids a false
// "offline" flash on cold start, and can't spuriously trigger a reconnect
// flow (that only fires on an offline -> online edge).
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsOnline(deriveIsOnline(state));
    });
  }, []);

  return { isOnline };
}
