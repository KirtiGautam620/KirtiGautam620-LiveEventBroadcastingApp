import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  ErrorView,
  LiveBadge,
  LoadingView,
  PrimaryButton,
  ScreenContainer,
  ViewerCountBadge,
} from '@/components';
import { ChatPanel } from '@/features/chat';
import { useAnonymousAuth, useCreateStream, useEndStream, usePresence } from '@/hooks';
import { useTheme } from '@/theme';

// Video area stays a placeholder View (no real playback yet). No offline
// queue, optimistic UI, or reconnect-sync logic implemented. Viewer count
// is real (Realtime Presence, Step 9); chat is real (Realtime Postgres
// Changes, Step 10).
export default function CreatorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAnonymousAuth();
  const createStream = useCreateStream();
  const endStream = useEndStream();

  const activeStream = createStream.data ?? null;
  // Called unconditionally, above the idle/live branch below (Rules of
  // Hooks) — usePresence accepts null and simply doesn't join until a
  // stream actually exists.
  const presence = usePresence(activeStream?.id ?? null);

  const handleStart = () => {
    // session is always set here: the root AuthGate blocks rendering any
    // screen until anonymous sign-in succeeds.
    if (!session) return;
    const input = { creator_id: session.user.id, title: 'Live Stream' };
    console.log(session.user.id);
    console.log(input);
    createStream.mutate(input, { onSuccess: (stream) => router.push(`/viewer/${stream.id}`) });
  };

  const handleEnd = () => {
    if (!activeStream) return;
    endStream.mutate(activeStream.id, { onSuccess: () => createStream.reset() });
  };

  if (!activeStream) {
    return (
      <ScreenContainer edges={['top', 'bottom']} style={{ padding: theme.spacing.lg }}>
        <View style={[styles.video, { borderRadius: theme.radius.lg }]}>
          <LinearGradient
            colors={['#341F97', '#0A0A0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: theme.radius.lg }]}
          />
          <View style={styles.idleOverlay}>
            <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>
              Ready to go live?
            </Text>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg, flex: 1 }}>
          {createStream.isPending ? (
            <LoadingView message="Starting stream..." />
          ) : createStream.isError ? (
            <ErrorView
              title="Couldn't start stream"
              description={createStream.error.message}
              actionLabel="Retry"
              onAction={handleStart}
            />
          ) : (
            <PrimaryButton label="Start Stream" onPress={handleStart} />
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} style={{ padding: theme.spacing.lg }}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.video, { borderRadius: theme.radius.lg }]}
      >
        <LinearGradient
          colors={['#341F97', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: theme.radius.lg }]}
        />
        <View style={[styles.overlayRow, { padding: theme.spacing.md }]}>
          <LiveBadge />
          <ViewerCountBadge count={presence.viewerCount} />
        </View>
      </Animated.View>

      <View
        style={[
          styles.chatPanel,
          {
            backgroundColor: theme.colors.overlay,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginTop: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
          ]}
        >
          CHAT
        </Text>
        <ChatPanel streamId={activeStream.id} />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <PrimaryButton
          label={
            endStream.isPending ? 'Ending...' : endStream.isError ? 'Failed — Retry' : 'End Stream'
          }
          variant="danger"
          onPress={handleEnd}
          disabled={endStream.isPending}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  video: { aspectRatio: 16 / 9, overflow: 'hidden' },
  idleOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chatPanel: { flex: 1 },
});
