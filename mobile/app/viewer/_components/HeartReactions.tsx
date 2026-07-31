import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components';
import { useTheme } from '@/theme';

// Instagram-Live-style reaction set — a random one is picked per tap so
// rapid tapping reads as a lively mixed burst rather than one repeated icon.
const REACTIONS = ['❤️', '💜', '🔥', '👏', '😍', '👍'] as const;

const HEART_SIZE = 26;
const BUTTON_SIZE = 48;
const RISE_DISTANCE = 220;
const DURATION_MS = 1400;
// Tall enough to hold a heart's full rise (RISE_DISTANCE) plus its own
// size, anchored at the button so hearts visually originate from it.
const HEART_LAYER_HEIGHT = RISE_DISTANCE + HEART_SIZE * 2;
// Clears LiveChatOverlay's input row (48px pill + its own top margin) so
// the button never sits on top of the message input.
const BOTTOM_OFFSET = 76;

let nextHeartId = 0;

function randomReaction(): string {
  const index = Math.floor(Math.random() * REACTIONS.length);
  return REACTIONS[index] ?? REACTIONS[0];
}

interface FloatingHeartProps {
  id: number;
  emoji: string;
  onComplete: (id: number) => void;
}

// Local UI effect only — not persisted, not sent over Realtime, and
// self-removing (via onComplete) so rapid tapping can't leak state.
function FloatingHeart({ id, emoji, onComplete }: FloatingHeartProps) {
  // Randomized once per heart (not re-rolled on re-render) so simultaneous
  // taps produce visually distinct size/drift/rotation paths instead of
  // overlapping identically.
  const [midDrift] = useState(() => (Math.random() - 0.5) * 50);
  const [endDrift] = useState(() => (Math.random() - 0.5) * 70);
  const [endRotation] = useState(() => (Math.random() - 0.5) * 60);
  // 0.75x-1.4x — a mixed-size burst reads as more organic than every
  // reaction landing at exactly the same size.
  const [sizeScale] = useState(() => 0.75 + Math.random() * 0.65);

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const handleComplete = useCallback(() => onComplete(id), [id, onComplete]);

  useEffect(() => {
    if (reduceMotion) {
      // The rise/drift/rotate flourish is exactly the kind of motion
      // prefers-reduced-motion asks apps to drop — still show the
      // reaction (it's the actual feedback for the tap), just as a brief
      // static fade instead of a moving burst.
      scale.value = sizeScale;
      opacity.value = withDelay(
        400,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(handleComplete)();
        }),
      );
      return;
    }
    translateY.value = withTiming(-RISE_DISTANCE, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    translateX.value = withSequence(
      withTiming(midDrift, { duration: DURATION_MS * 0.5, easing: Easing.inOut(Easing.ease) }),
      withTiming(endDrift, { duration: DURATION_MS * 0.5, easing: Easing.inOut(Easing.ease) }),
    );
    rotate.value = withTiming(endRotation, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withSequence(
      withTiming(sizeScale * 1.15, { duration: 180, easing: Easing.out(Easing.back(2)) }),
      withTiming(sizeScale, { duration: 150 }),
    );
    opacity.value = withDelay(
      DURATION_MS * 0.55,
      withTiming(0, { duration: DURATION_MS * 0.45 }, (finished) => {
        if (finished) runOnJS(handleComplete)();
      }),
    );
    // Runs once on mount — this heart's animation never restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.heart, animatedStyle]}>
      <Text style={styles.heartEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

interface HeartInstance {
  id: number;
  emoji: string;
}

// Floating heart-reaction button for the Viewer screen, Instagram/YouTube
// Live style. Entirely local UI state — taps never reach Supabase or
// Realtime, so this has no effect on chat, presence, or viewer count.
export function HeartReactions() {
  const theme = useTheme();
  const [hearts, setHearts] = useState<HeartInstance[]>([]);

  const handleTap = useCallback(() => {
    nextHeartId += 1;
    setHearts((current) => [...current, { id: nextHeartId, emoji: randomReaction() }]);
  }, []);

  const handleComplete = useCallback((id: number) => {
    setHearts((current) => current.filter((heart) => heart.id !== id));
  }, []);

  return (
    <View
      style={[styles.container, { right: theme.spacing.sm, bottom: BOTTOM_OFFSET }]}
      pointerEvents="box-none"
    >
      <View style={styles.heartLayer} pointerEvents="none">
        {hearts.map((heart) => (
          <FloatingHeart
            key={heart.id}
            id={heart.id}
            emoji={heart.emoji}
            onComplete={handleComplete}
          />
        ))}
      </View>
      <AnimatedPressable
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel="Send heart reaction"
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.overlayStrong,
            borderColor: theme.colors.glassBorder,
            ...theme.shadows.md,
          },
        ]}
      >
        <Ionicons name="heart" size={24} color={theme.colors.live} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center' },
  heartLayer: {
    position: 'absolute',
    bottom: BUTTON_SIZE / 2,
    left: BUTTON_SIZE / 2 - HEART_SIZE / 2,
    width: HEART_SIZE,
    height: HEART_LAYER_HEIGHT,
  },
  heart: { position: 'absolute', bottom: 0 },
  heartEmoji: { fontSize: HEART_SIZE },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
