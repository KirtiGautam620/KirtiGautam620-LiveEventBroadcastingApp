import { useMutation, useQueryClient } from '@tanstack/react-query';

import { streamRepository } from '@/repositories';
import type { StartStreamInput } from '@/types/database';

import { STREAMS_QUERY_KEY } from './useStreams';

export function useCreateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StartStreamInput) => {
      // streams_one_live_per_creator allows at most one live stream per
      // creator. Checking first lets us resume the existing stream instead
      // of hitting that constraint as an insert error.
      const existing = await streamRepository.getLiveByCreator(input.creator_id);
      if (existing) return existing;
      return streamRepository.start(input);
    },
    onSuccess: () => {
      // start() returns a plain Stream, not the enriched StreamWithCreator
      // shape the streams-list cache holds (embedded creator profile) —
      // invalidate and refetch rather than patching the cache with a
      // mismatched shape.
      void queryClient.invalidateQueries({ queryKey: STREAMS_QUERY_KEY });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}
