import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components';
import { useTheme } from '@/theme';

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

interface FloatingHeartProps {
  id: number;
  color: string;
  onComplete: (id: number) => void;
}

// Local UI effect only — not persisted, not sent over Realtime, and
// self-removing (via onComplete) so rapid tapping can't leak state.
function FloatingHeart({ id, color, onComplete }: FloatingHeartProps) {
  // Randomized once per heart (not re-rolled on re-render) so simultaneous
  // taps produce visually distinct drift paths instead of overlapping
  // identically.
  const [midDrift] = useState(() => (Math.random() - 0.5) * 50);
  const [endDrift] = useState(() => (Math.random() - 0.5) * 70);

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(1);

  const handleComplete = useCallback(() => onComplete(id), [id, onComplete]);

  useEffect(() => {
    translateY.value = withTiming(-RISE_DISTANCE, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    translateX.value = withSequence(
      withTiming(midDrift, { duration: DURATION_MS * 0.5, easing: Easing.inOut(Easing.ease) }),
      withTiming(endDrift, { duration: DURATION_MS * 0.5, easing: Easing.inOut(Easing.ease) }),
    );
    scale.value = withSequence(
      withTiming(1.15, { duration: 180, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 150 }),
    );
    opacity.value = withDelay(
      DURATION_MS * 0.55,
      withTiming(0, { duration: DURATION_MS * 0.45 }, (finished) => {
        if (finished) runOnJS(handleComplete)();
      }),
    );
    // Runs once on mount — this heart's animation never restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.heart, animatedStyle]}>
      <Ionicons name="heart" size={HEART_SIZE} color={color} />
    </Animated.View>
  );
}

// Floating heart-reaction button for the Viewer screen, Instagram/YouTube
// Live style. Entirely local UI state — taps never reach Supabase or
// Realtime, so this has no effect on chat, presence, or viewer count.
export function HeartReactions() {
  const theme = useTheme();
  const [hearts, setHearts] = useState<number[]>([]);

  const handleTap = useCallback(() => {
    nextHeartId += 1;
    setHearts((current) => [...current, nextHeartId]);
  }, []);

  const handleComplete = useCallback((id: number) => {
    setHearts((current) => current.filter((heartId) => heartId !== id));
  }, []);

  return (
    <View
      style={[styles.container, { right: theme.spacing.lg, bottom: BOTTOM_OFFSET }]}
      pointerEvents="box-none"
    >
      <View style={styles.heartLayer} pointerEvents="none">
        {hearts.map((id) => (
          <FloatingHeart key={id} id={id} color={theme.colors.live} onComplete={handleComplete} />
        ))}
      </View>
      <AnimatedPressable
        onPress={handleTap}
        style={[styles.button, { backgroundColor: theme.colors.overlay }]}
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
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
