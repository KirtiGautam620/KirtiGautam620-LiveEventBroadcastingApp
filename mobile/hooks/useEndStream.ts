import { useMutation, useQueryClient } from '@tanstack/react-query';

import { streamRepository } from '@/repositories';

import { STREAMS_QUERY_KEY } from './useStreams';

export function useEndStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => streamRepository.end(id),
    onSuccess: () => {
      // Ended stream no longer matches listLive()'s status = 'live' filter —
      // refetch so it drops out of the streams-list cache.
      void queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEY });
    },
  });
}
