import { useQuery } from '@tanstack/react-query';

import { streamRepository } from '@/repositories';

export function streamDetailQueryKey(streamId: string) {
  return ['streams', 'detail', streamId] as const;
}

export function useStream(streamId: string) {
  return useQuery({
    queryKey: streamDetailQueryKey(streamId),
    queryFn: () => streamRepository.getById(streamId),
  });
}
