import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { streamRepository } from '@/repositories';
import { joinStreamRealtime } from '@/services/streamRealtime';
import type { StreamWithCreator } from '@/types/database';

export function streamDetailQueryKey(streamId: string) {
  return ['streams', 'detail', streamId] as const;
}

export function useStream(streamId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: streamDetailQueryKey(streamId),
    queryFn: () => streamRepository.getById(streamId),
  });

  // Without this, a viewer watching when the creator ends the stream never
  // finds out — nothing else refetches this query, so `status` would stay
  // 'live' in their cache forever and their usePresence(id) call (gated on
  // status === 'live', see app/viewer/[id].tsx) would never leave the
  // presence channel. Goes through services/streamRealtime.ts (not
  // streamRepository.subscribeToStream directly) so repeated mounts of
  // this hook for the same streamId share one underlying subscription
  // instead of racing duplicate channels.
  useEffect(() => {
    if (!streamId) return;
    return joinStreamRealtime(streamId, (updated) => {
      // subscribeToStream's payload is a plain Stream (postgres_changes
      // can't carry the creator join) — patch the changed columns into the
      // existing StreamWithCreator entry instead of overwriting it with a
      // shape that's missing `creator`.
      queryClient.setQueryData<StreamWithCreator>(streamDetailQueryKey(streamId), (existing) =>
        existing ? { ...existing, ...updated } : existing,
      );
    });
  }, [streamId, queryClient]);

  return query;
}
