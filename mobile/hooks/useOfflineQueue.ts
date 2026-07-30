import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { chatQueueRepository } from '@/database/chatQueue.repository';
import { syncPendingMessages } from '@/services/syncEngine';

const pendingCountQueryKey = ['offlineQueue', 'pendingCount'] as const;

export interface UseOfflineQueueResult {
  syncPending: () => Promise<void>;
  syncing: boolean;
  pendingCount: number;
}

export function useOfflineQueue(): UseOfflineQueueResult {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const pendingCountQuery = useQuery({
    queryKey: pendingCountQueryKey,
    queryFn: async () => {
      const pending = await chatQueueRepository.getPendingMessages();
      return pending.length;
    },
  });

  const syncPending = useCallback(async () => {
    setSyncing(true);
    try {
      await syncPendingMessages();
    } finally {
      setSyncing(false);
      await queryClient.invalidateQueries({ queryKey: pendingCountQueryKey });
    }
  }, [queryClient]);

  return {
    syncPending,
    syncing,
    pendingCount: pendingCountQuery.data ?? 0,
  };
}
