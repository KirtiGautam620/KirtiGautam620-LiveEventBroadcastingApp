import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

import { AnimatedPressable } from './AnimatedPressable';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'accent' | 'danger';
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'accent',
}: PrimaryButtonProps) {
  const theme = useTheme();
  // Subtle two-stop gradient rather than a flat fill for the accent
  // variant. Danger stays a single flat hue — a gradient on a destructive
  // action reads as decorative rather than serious.
  const gradientColors =
    variant === 'danger'
      ? ([theme.colors.danger, theme.colors.danger] as const)
      : ([theme.colors.accent, theme.colors.accentPink] as const);

  return (
    // Shadow lives on this outer, non-clipping wrapper — combining a shadow
    // with overflow:'hidden' on the same view clips the shadow to nothing
    // on iOS, so the gradient-clipping view below stays shadow-free.
    <View style={disabled ? undefined : theme.shadows.sm}>
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.base, { borderRadius: theme.radius.lg, opacity: disabled ? 0.5 : 1 }]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text
          style={[
            theme.typography.bodyStrong,
            styles.label,
            {
              color: theme.colors.textPrimary,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
        >
          {label}
        </Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  label: { textAlign: 'center' },
});
