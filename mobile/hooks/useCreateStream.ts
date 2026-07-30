import { useMutation, useQueryClient } from '@tanstack/react-query';

import { streamRepository } from '@/repositories';
import type { StartStreamInput } from '@/types/database';

import { STREAMS_QUERY_KEY } from './useStreams';

export function useCreateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StartStreamInput) => streamRepository.start(input),
    onSuccess: () => {
      // start() returns a plain Stream, not the enriched StreamWithCreator
      // shape the streams-list cache holds (embedded creator profile) —
      // invalidate and refetch rather than patching the cache with a
      // mismatched shape.
      void queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEY });
    },
  });
}
