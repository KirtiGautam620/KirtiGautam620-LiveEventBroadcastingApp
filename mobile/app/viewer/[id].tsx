import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnimatedPressable,
  Avatar,
  LiveBadge,
  PrimaryButton,
  ViewerCountBadge,
} from '@/components';
import { usePresence, useStream } from '@/hooks';
import { useTheme } from '@/theme';

import { HeartReactions } from './_components/HeartReactions';
import { LiveChatOverlay } from './_components/LiveChatOverlay';

// Video area stays a placeholder (gradient background). No offline queue,
// optimistic UI, or reconnect-sync logic implemented. Viewer count is real
// (Realtime Presence, Step 9); chat is real (Realtime Postgres Changes,
// Step 10).
//
// Presentation-only pass (Instagram-Live-style layout): the video is a
// full-bleed backdrop, not a card, and chat renders directly over it via
// LiveChatOverlay instead of a separate panel. useChat/usePresence/useStream
// are untouched — this screen no longer renders features/chat/ChatPanel at
// all, so nothing here affects the Creator screen's chat surface.

export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { data: stream, isPending, isError, refetch } = useStream(id);
  const presence = usePresence(id);
  // display_name only — never fall back to username (it's UUID-derived,
  // e.g. "user_3f8a9b2c", exactly the anonymous-looking id this screen is
  // meant to avoid showing).
  const creatorLabel = stream?.creator?.display_name?.trim() || 'Creator';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Full-bleed video placeholder — the entire screen's backdrop, not a
          card. Renders immediately, independent of the stream query, so
          the player feels instant rather than popping in once data
          resolves. */}
      <LinearGradient
        colors={['#341F97', '#1B0F5C', '#0A0A0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Darkens the lower half so the floating chat/input stay legible
          over whatever's behind them. */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View
          style={[
            styles.topOverlay,
            { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.sm },
          ]}
        >
          <View style={styles.topOverlayLeft}>
            {stream ? <Avatar name={creatorLabel} size={32} /> : null}
            <View style={{ marginLeft: theme.spacing.sm, flexShrink: 1 }}>
              <View style={styles.creatorRow}>
                {stream ? (
                  <Text
                    numberOfLines={1}
                    style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}
                  >
                    {creatorLabel}
                  </Text>
                ) : null}
                <View style={{ marginLeft: theme.spacing.sm }}>
                  <LiveBadge />
                </View>
              </View>
              <View style={{ marginTop: theme.spacing.xs }}>
                <ViewerCountBadge count={presence.viewerCount} />
              </View>
              {stream ? (
                <Text
                  numberOfLines={1}
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
                  ]}
                >
                  {stream.title}
                </Text>
              ) : null}
            </View>
          </View>

          <AnimatedPressable
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              { backgroundColor: theme.colors.overlay, borderRadius: theme.radius.full },
            ]}
          >
            <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>
              ✕
            </Text>
          </AnimatedPressable>
        </View>

        <View style={styles.spacer}>
          {isPending ? (
            <View style={styles.pendingState}>
              <ActivityIndicator color={theme.colors.textPrimary} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
                ]}
              >
                Loading stream...
              </Text>
            </View>
          ) : isError ? (
            <View style={[styles.pendingState, { paddingHorizontal: theme.spacing.lg }]}>
              <Text
                style={[
                  theme.typography.bodyStrong,
                  { color: theme.colors.textPrimary, textAlign: 'center' },
                ]}
              >
                {"Couldn't load stream"}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    marginTop: theme.spacing.xs,
                  },
                ]}
              >
                Something went wrong while loading this stream.
              </Text>
              <View style={{ marginTop: theme.spacing.md, alignSelf: 'stretch' }}>
                <PrimaryButton label="Retry" onPress={() => void refetch()} />
              </View>
            </View>
          ) : !stream ? (
            <View style={[styles.centeredState, { paddingHorizontal: theme.spacing.lg }]}>
              <Text
                style={[
                  theme.typography.bodyStrong,
                  { color: theme.colors.textPrimary, textAlign: 'center' },
                ]}
              >
                Stream not found
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    marginTop: theme.spacing.xs,
                  },
                ]}
              >
                This stream may have ended or the link is invalid.
              </Text>
            </View>
          ) : (
            <Animated.View
              entering={SlideInUp.duration(350)}
              style={{ paddingBottom: theme.spacing.sm }}
            >
              <LiveChatOverlay streamId={stream.id} />
            </Animated.View>
          )}
        </View>

        {/* Local UI effect only — see HeartReactions. Rendered only once a
            stream is actually loaded, same gate as the chat overlay. */}
        {stream ? <HeartReactions /> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '45%' },
  safeArea: { flex: 1 },
  topOverlay: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  topOverlayLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  creatorRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  // Chat overlay is pinned to the bottom of the remaining space, leaving
  // the video visible above it rather than filling the whole screen.
  spacer: { flex: 1, justifyContent: 'flex-end' },
  pendingState: { alignItems: 'center', paddingBottom: 32 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
