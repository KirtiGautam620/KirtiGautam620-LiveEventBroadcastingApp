import { useQuery } from '@tanstack/react-query';

import { profileRepository } from '@/repositories';

export function profileQueryKey(userId: string) {
  return ['profile', userId] as const;
}

// userId is nullable so this can be called unconditionally (Rules of Hooks)
// before a session exists yet — enabled: false simply skips fetching.
export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: profileQueryKey(userId ?? ''),
    queryFn: () => profileRepository.getById(userId as string),
    enabled: userId !== null,
  });
}
