import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { streamRepository } from '@/repositories';
import { joinLiveStreamsRealtime } from '@/services/streamRealtime';
import type { StreamWithCreator } from '@/types/database';

export const STREAMS_QUERY_KEY = ['streams', 'live'] as const;

export function useStreams() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: STREAMS_QUERY_KEY,
    queryFn: () => streamRepository.listLive(),
  });

  // Keeps Browse in sync in realtime with any stream starting or ending,
  // including on a different device — without this, an ended stream would
  // only disappear here after a manual refresh or refocus. Goes through
  // services/streamRealtime.ts (not streamRepository.subscribeToLiveStreams
  // directly) so repeated mounts of this hook share one underlying
  // subscription instead of racing duplicate 'streams:list' channels.
  useEffect(() => {
    return joinLiveStreamsRealtime((streams) => {
      queryClient.setQueryData<StreamWithCreator[]>(STREAMS_QUERY_KEY, streams);
    });
  }, [queryClient]);

  return query;
}
