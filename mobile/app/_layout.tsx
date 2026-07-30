import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ErrorView, LoadingView } from '@/components';
import { initializeDatabase } from '@/database/database';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
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
  const { isLoading, error, retry } = useAnonymousAuth();
  // Global, stateless-per-screen: reacts to network transitions and drives
  // the reconnect flow for the whole app. Needs to be inside
  // QueryClientProvider (it invalidates chat queries), which is why it's
  // called here rather than in RootLayout above.
  useReconnect();

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

  return <Stack screenOptions={{ headerShown: false }} />;
}
