import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileRepository } from '@/repositories';

import { profileQueryKey } from './useProfile';

// Only the one-time onboarding write path — not a general profile-editing
// hook (this is intentionally a small feature, not a social profile system).
export function useUpdateDisplayName(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) =>
      profileRepository.update(userId, { display_name: displayName }),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(userId), profile);
    },
  });
}
