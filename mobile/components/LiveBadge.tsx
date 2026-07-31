import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

export function LiveBadge() {
  const theme = useTheme();
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // An infinitely-repeating pulse is exactly the kind of motion
    // prefers-reduced-motion exists to suppress — the dot just stays solid
    // instead, the badge itself (color + "LIVE" text) still communicates
    // the status.
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [pulse, reduceMotion]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View
      accessible
      accessibilityLabel="Live now"
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.live,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          ...theme.shadows.sm,
        },
      ]}
    >
      <Animated.View
        style={[styles.dot, dotStyle, { backgroundColor: theme.colors.textPrimary }]}
      />
      <Text
        style={[
          theme.typography.label,
          styles.label,
          { color: theme.colors.textPrimary, marginLeft: theme.spacing.xs },
        ]}
      >
        LIVE
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { letterSpacing: 0.5 },
});
