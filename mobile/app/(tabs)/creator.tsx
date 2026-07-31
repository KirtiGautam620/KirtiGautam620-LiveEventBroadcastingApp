import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import {
  AppHeader,
  LiveBadge,
  PrimaryButton,
  ScreenContainer,
  ViewerCountBadge,
} from '@/components';
import { ChatPanel } from '@/features/chat';
import { type GoLiveInput, GoLiveModal } from '@/features/creator';
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
const SCREEN_PADDING = 24; // theme.spacing.md

// ScreenContainer below only requests the 'top' safe-area edge, not
// 'bottom': this screen renders inside the (tabs) navigator's content
// area, which sits above the tab bar and never reaches the physical
// bottom of the device — useSafeAreaInsets() returns the same
// window-level bottom inset everywhere, so adding it here too would
// double it up on top of the tab bar's own bottom inset padding (see
// app/(tabs)/_layout.tsx).

export default function CreatorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAnonymousAuth();
  const createStream = useCreateStream();
  const endStream = useEndStream();

  const [isGoLiveVisible, setIsGoLiveVisible] = useState(false);

  const activeStream = createStream.data ?? null;
  // Called unconditionally, above the idle/live branch below (Rules of
  // Hooks) — usePresence accepts null and simply doesn't join until a
  // stream actually exists.
  const presence = usePresence(activeStream?.id ?? null);

  const handleGoLiveSubmit = ({ title, category }: GoLiveInput) => {
    // session is always set here: the root AuthGate blocks rendering any
    // screen until anonymous sign-in succeeds.
    if (!session) return;
    createStream.mutate(
      { creator_id: session.user.id, title, category },
      {
        onSuccess: (stream) => {
          setIsGoLiveVisible(false);
          router.push(`/viewer/${stream.id}`);
        },
      },
    );
  };

  const handleEnd = () => {
    if (!activeStream) return;
    endStream.mutate(activeStream.id, { onSuccess: () => createStream.reset() });
  };

  if (!activeStream) {
    return (
      <ScreenContainer edges={['top']} style={{ paddingHorizontal: SCREEN_PADDING }}>
        <AppHeader
          title="Go Live"
          subtitle="Start broadcasting and connect with your audience in real time."
        />

        <Animated.View
          entering={FadeInDown.duration(450)}
          style={[
            styles.preview,
            {
              borderRadius: theme.radius.xxl,
              marginTop: theme.spacing.sm,
              ...theme.shadows.lg,
            },
          ]}
        >
          <LinearGradient
            colors={theme.gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
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
                  marginTop: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
            >
              Your camera preview will appear here once you go live.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(450).delay(120)}
          style={{ marginTop: theme.spacing.md }}
        >
          <PrimaryButton label="Start Stream" onPress={() => setIsGoLiveVisible(true)} />
        </Animated.View>

        <GoLiveModal
          visible={isGoLiveVisible}
          isSubmitting={createStream.isPending}
          errorMessage={createStream.isError ? createStream.error.message : null}
          onClose={() => setIsGoLiveVisible(false)}
          onSubmit={handleGoLiveSubmit}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top']} style={{ padding: SCREEN_PADDING }}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.preview, { borderRadius: theme.radius.xxl, ...theme.shadows.lg }]}
      >
        <LinearGradient
          colors={theme.gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.overlayRow, { padding: theme.spacing.sm }]}>
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
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radius.xl,
            marginTop: theme.spacing.sm,
            ...theme.shadows.md,
          },
        ]}
      >
        <View
          style={[
            styles.chatHeader,
            {
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.chatDot, { backgroundColor: theme.colors.accent }]} />
          <Text
            style={[
              theme.typography.bodyStrong,
              { color: theme.colors.textPrimary, marginLeft: theme.spacing.xs },
            ]}
          >
            Live Chat
          </Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: theme.spacing.xs }}>
          <ChatPanel streamId={activeStream.id} creatorId={activeStream.creator_id} />
        </View>
      </Animated.View>

      <View style={{ marginTop: theme.spacing.sm }}>
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
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatDot: { width: 6, height: 6, borderRadius: 3 },
});
