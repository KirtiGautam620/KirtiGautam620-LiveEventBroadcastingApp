import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import {
  AppHeader,
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
//
// Presentation-only pass: layout, spacing, color, typography and entrance
// animations below. No hooks, business logic, navigation, or ChatPanel
// internals were touched.

// Outside the theme's radius scale (largest token is xl = 20) — the design
// spec calls for exactly 24px on this screen's preview card specifically.
const PREVIEW_RADIUS = 24;

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
      <ScreenContainer edges={['top', 'bottom']} style={{ paddingHorizontal: theme.spacing.lg }}>
        <AppHeader
          title="Go Live"
          subtitle="Start broadcasting and connect with your audience in real time."
        />

        <Animated.View
          entering={FadeInDown.duration(450)}
          style={[
            styles.preview,
            {
              borderRadius: PREVIEW_RADIUS,
              marginTop: theme.spacing.lg,
              ...theme.shadows.lg,
            },
          ]}
        >
          <LinearGradient
            colors={[
              theme.colors.accentMuted,
              theme.colors.surfaceElevated,
              theme.colors.background,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: PREVIEW_RADIUS }]}
          />
          <View style={styles.idleOverlay}>
            <Text style={[theme.typography.heading1, { color: theme.colors.textPrimary }]}>
              Ready when you are
            </Text>
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.xl,
                },
              ]}
            >
              Your camera preview will appear here once you go live.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(450).delay(120)}
          style={{ marginTop: theme.spacing.xl }}
        >
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
        </Animated.View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} style={{ padding: theme.spacing.lg }}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.preview, { borderRadius: PREVIEW_RADIUS, ...theme.shadows.lg }]}
      >
        <LinearGradient
          colors={[theme.colors.accentMuted, theme.colors.surfaceElevated, theme.colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: PREVIEW_RADIUS }]}
        />
        <View style={[styles.overlayRow, { padding: theme.spacing.lg }]}>
          <LiveBadge />
          <ViewerCountBadge count={presence.viewerCount} />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(400).delay(100)}
        style={[
          styles.chatPanel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
            marginTop: theme.spacing.lg,
            ...theme.shadows.md,
          },
        ]}
      >
        <View
          style={[
            styles.chatHeader,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>
            Chat
          </Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.xs }}>
          <ChatPanel streamId={activeStream.id} />
        </View>
      </Animated.View>

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
  preview: { aspectRatio: 16 / 9, overflow: 'hidden' },
  idleOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chatPanel: { flex: 1, overflow: 'hidden' },
  chatHeader: { borderBottomWidth: StyleSheet.hairlineWidth },
});
