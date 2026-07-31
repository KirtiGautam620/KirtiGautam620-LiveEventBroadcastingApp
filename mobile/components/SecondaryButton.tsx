import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';

import { AnimatedPressable } from './AnimatedPressable';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function SecondaryButton({ label, onPress, disabled }: SecondaryButtonProps) {
  const theme = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: theme.radius.lg,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.bodyStrong,
          { color: theme.colors.textPrimary, textAlign: 'center' },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
});
