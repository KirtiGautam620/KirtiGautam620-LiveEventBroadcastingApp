import { StyleSheet, Text } from 'react-native';

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
  const backgroundColor = variant === 'danger' ? theme.colors.danger : theme.colors.accent;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          backgroundColor,
          borderRadius: theme.radius.lg,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
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
  base: { alignItems: 'center', justifyContent: 'center' },
});
