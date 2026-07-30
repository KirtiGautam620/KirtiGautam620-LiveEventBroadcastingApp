import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

interface ViewerCountBadgeProps {
  count: number;
}

export function ViewerCountBadge({ count }: ViewerCountBadgeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.overlay,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs / 2,
        },
      ]}
    >
      <Text style={[theme.typography.label, { color: theme.colors.textPrimary }]}>
        👁 {formatCount(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
});
