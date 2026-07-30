import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ErrorView, LoadingView } from '@/components';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/theme';

export default function RootLayout() {
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
