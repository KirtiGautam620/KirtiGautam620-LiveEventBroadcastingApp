import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AnimatedPressable } from './AnimatedPressable';

interface CardProps extends PropsWithChildren {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  // Optional: when a pressable Card's content is more than one short line
  // (e.g. a stream's title + creator + category all read separately by
  // default), this gives screen readers one coherent announcement instead
  // of several fragments.
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, accessibilityLabel }: CardProps) {
  const theme = useTheme();
  const cardStyle = [
    styles.base,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.sm,
      ...theme.shadows.md,
    },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={cardStyle}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {},
});
