import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
//
// Every decorative full-bleed layer below (video gradient, scrims) is
// pointerEvents="none" so it can never intercept a tap meant for the
// controls stacked above it (back button, badges, chat input, reactions).

export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { data: stream, isPending, isError, refetch } = useStream(id);
  // Gated on the stream actually being live (not just this screen being
  // mounted) — useStream's realtime subscription updates `stream.status`
  // the moment the creator ends the stream, which flips this to null and
  // makes usePresence leave the channel instead of staying tracked on a
  // stream that's no longer live.
  const presence = usePresence(stream?.status === 'live' ? id : null);
  // display_name only — never fall back to username (it's UUID-derived,
  // e.g. "user_3f8a9b2c", exactly the anonymous-looking id this screen is
  // meant to avoid showing).
  const creatorLabel = stream?.creator?.display_name?.trim() || 'Creator';
  const hasEnded = stream?.status === 'ended';

  // TEMPORARY diagnostic — determines whether ViewerScreen itself is being
  // unmounted/remounted (as opposed to just re-rendering) while the user is
  // interacting with the chat input. Safe to delete once confirmed.
  useEffect(() => {
    console.log('[ViewerScreen] mounted');
    return () => console.log('[ViewerScreen] unmounted');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Full-bleed video placeholder — the entire screen's backdrop, not a
          card. Renders immediately, independent of the stream query, so
          the player feels instant rather than popping in once data
          resolves. */}
      <LinearGradient
        colors={theme.gradients.stage}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Darkens the top so the floating back button / badges stay legible
          over whatever's behind them. */}
      <LinearGradient
        colors={theme.gradients.scrimTop}
        style={styles.topScrim}
        pointerEvents="none"
      />
      {/* Darkens the lower half so the floating chat/input stay legible
          over whatever's behind them. */}
      <LinearGradient
        colors={theme.gradients.scrimBottom}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {hasEnded ? (
          // Full-screen, replaces all "live" chrome (badge, viewer count,
          // chat, heart reactions) rather than just swapping out the
          // bottom section — none of it is meaningful once the stream has
          // ended. Reached automatically: useStream()'s realtime
          // subscription flips stream.status to 'ended' the moment the
          // creator ends the stream, no manual refresh involved.
          <Animated.View
            entering={SlideInUp.duration(350)}
            style={[styles.centeredState, { paddingHorizontal: theme.spacing.md }]}
          >
            <View
              style={[
                styles.endedIconCircle,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  marginBottom: theme.spacing.sm,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <Ionicons name="videocam-off-outline" size={28} color={theme.colors.textSecondary} />
            </View>
            <Text
              style={[
                theme.typography.heading1,
                { color: theme.colors.textPrimary, textAlign: 'center' },
              ]}
            >
              This stream has ended
            </Text>
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              Thanks for watching. Check out what else is live right now.
            </Text>
            <View style={{ marginTop: theme.spacing.md, alignSelf: 'stretch' }}>
              <PrimaryButton label="Back to Browse" onPress={() => router.replace('/')} />
            </View>
          </Animated.View>
        ) : (
          // Keyboard-aware: without this, the keyboard opening simply
          // covers the pinned-to-bottom chat input on iOS. `behavior` is
          // undefined (not 'height') on Android *deliberately* — Expo's
          // managed-app default for Android is windowSoftInputMode
          // "adjustResize" (this is Expo's own default, not bare React
          // Native's — bare RN/the OS default is "adjustPan"), meaning
          // the native window already resizes itself when the keyboard
          // opens. Setting KeyboardAvoidingView to also resize its own
          // container height on Android double-compensates: the content
          // gets pushed up by the native resize AND by this component,
          // which can push the input off-screen or bounce it through a
          // resize→remeasure→resize cycle — this is what was actually
          // behind "opens once, then immediately loses focus" (a
          // regression from a previous, incorrect attempt at this exact
          // fix). Leaving Android alone lets the one native mechanism
          // that's already active do the whole job.
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoider}
          >
            <View style={{ paddingHorizontal: theme.spacing.sm, marginTop: theme.spacing.xs }}>
              <View style={styles.topRow}>
                <AnimatedPressable
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: theme.colors.overlayStrong,
                      borderRadius: theme.radius.full,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.glassBorder,
                      ...theme.shadows.sm,
                    },
                  ]}
                >
                  <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
                </AnimatedPressable>

                <View style={styles.liveCountGroup}>
                  <LiveBadge />
                  <ViewerCountBadge count={presence.viewerCount} />
                </View>
              </View>

              {stream ? (
                <View style={[styles.creatorInfoRow, { marginTop: theme.spacing.xs }]}>
                  <Avatar name={creatorLabel} size={36} />
                  <View style={{ marginLeft: theme.spacing.xs, flexShrink: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.heading2,
                        styles.overlayTextShadow,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {creatorLabel}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.bodyStrong,
                        styles.overlayTextShadow,
                        { color: 'rgba(255, 255, 255, 0.88)', marginTop: 2 },
                      ]}
                    >
                      {stream.title}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.spacer}>
              {isPending ? (
                <View style={styles.pendingState}>
                  <ActivityIndicator color={theme.colors.textPrimary} />
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
                    ]}
                  >
                    Loading stream...
                  </Text>
                </View>
              ) : isError ? (
                <View style={[styles.pendingState, { paddingHorizontal: theme.spacing.md }]}>
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
                  <View style={{ marginTop: theme.spacing.sm, alignSelf: 'stretch' }}>
                    <PrimaryButton label="Retry" onPress={() => void refetch()} />
                  </View>
                </View>
              ) : !stream ? (
                <View style={[styles.centeredState, { paddingHorizontal: theme.spacing.md }]}>
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
                // Deliberately a plain View, not an Animated.View with an
                // `entering` transform: Reanimated's entering animations
                // mutate the native transform directly on the UI thread
                // while React's committed layout briefly lags behind,
                // which is exactly what made the very first tap on the
                // TextInput inside LiveChatOverlay land on stale
                // coordinates and get swallowed (fixed in Issue 1 — see
                // bug-fix notes). A decorative slide-in isn't worth an
                // unfocusable input on first tap.
                <View style={{ paddingBottom: theme.spacing.xs }}>
                  <LiveChatOverlay streamId={stream.id} creatorId={stream.creator_id} />
                </View>
              )}
            </View>

            {/* Local UI effect only — see HeartReactions. Rendered only
                once a stream is actually loaded, same gate as the chat
                overlay. Unmounted (along with LiveChatOverlay above) as
                soon as hasEnded flips true, which is what tears down the
                chat realtime subscription — see useChat's cleanup. */}
            {stream ? <HeartReactions /> : null}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topScrim: { position: 'absolute', left: 0, right: 0, top: 0, height: '22%' },
  bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '45%' },
  safeArea: { flex: 1 },
  keyboardAvoider: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveCountGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorInfoRow: { flexDirection: 'row', alignItems: 'center' },
  // Keeps the creator name/title readable over bright or busy video
  // content without needing a heavier scrim behind them.
  overlayTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // 44px meets the standard minimum comfortable touch target size.
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  // Chat overlay is pinned to the bottom of the remaining space, leaving
  // the video visible above it rather than filling the whole screen.
  spacer: { flex: 1, justifyContent: 'flex-end' },
  pendingState: { alignItems: 'center', paddingBottom: 32 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  endedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
