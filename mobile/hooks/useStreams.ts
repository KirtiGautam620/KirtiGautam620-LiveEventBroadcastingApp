import { useQuery } from '@tanstack/react-query';

import { streamRepository } from '@/repositories';

export const STREAMS_QUERY_KEY = ['streams', 'live'] as const;

export function useStreams() {
  return useQuery({
    queryKey: STREAMS_QUERY_KEY,
    queryFn: () => streamRepository.listLive(),
  });
}
