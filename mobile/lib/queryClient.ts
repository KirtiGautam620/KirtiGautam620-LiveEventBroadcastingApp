import { QueryClient } from '@tanstack/react-query';

// Single shared React Query client. Server state (anything read from
// Supabase, via repositories/) is cached and invalidated here instead of
// being duplicated into Zustand stores.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});
