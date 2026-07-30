import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorView, LoadingView } from '@/components';
import { initializeDatabase } from '@/database/database';
import { DisplayNameScreen } from '@/features/onboarding';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReconnect } from '@/hooks/useReconnect';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/theme';

export default function RootLayout() {
  // Fire-and-forget: opens the local SQLite db and runs migrations so the
  // offline chat queue is ready before anything tries to use it. Failures
  // are logged, not surfaced in UI — no error/reconnect handling for local
  // storage has been requested yet.
  useEffect(() => {
    initializeDatabase().catch((error: unknown) => {
      console.error('Failed to initialize local database', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StatusBar style="light" />
        <AuthGate />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { session, isLoading, error, retry } = useAnonymousAuth();
  // Global, stateless-per-screen: reacts to network transitions and drives
  // the reconnect flow for the whole app. Needs to be inside
  // QueryClientProvider (it invalidates chat queries), which is why it's
  // called here rather than in RootLayout above.
  useReconnect();

  const userId = session?.user.id ?? null;
  // Called unconditionally (Rules of Hooks), same as useReconnect above —
  // enabled: false (via userId === null) simply skips fetching until a
  // session exists.
  const profileQuery = useProfile(userId);

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <ErrorView
        title="Connection failed"
        description="We couldn't reach the server. Please try again."
        actionLabel="Retry"
        onAction={retry}
      />
    );
  }

  // session is guaranteed non-null past this point: isLoading/error above
  // cover every outcome of useAnonymousAuth except a resolved session.
  if (profileQuery.isPending) {
    return <LoadingView />;
  }

  if (profileQuery.isError) {
    return (
      <ErrorView
        title="Connection failed"
        description="We couldn't load your profile. Please try again."
        actionLabel="Retry"
        onAction={() => void profileQuery.refetch()}
      />
    );
  }

  // Blocking, one-time onboarding: a profile row always exists by the time
  // sign-in resolves (auto-provisioned by the handle_new_user trigger), but
  // display_name starts out null until the user sets one here.
  if (!profileQuery.data?.display_name?.trim()) {
    return <DisplayNameScreen userId={userId as string} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
