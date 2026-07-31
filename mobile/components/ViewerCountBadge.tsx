import { Ionicons } from '@expo/vector-icons';
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
      accessible
      // The eye icon carries meaning a bare number doesn't for a screen
      // reader — announce the exact count (not the abbreviated "1.2K"
      // shown visually) so it isn't misheard as just an arbitrary number.
      accessibilityLabel={`${count} ${count === 1 ? 'person' : 'people'} watching`}
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.overlayStrong,
          borderRadius: theme.radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.glassBorder,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        },
      ]}
    >
      <Ionicons name="eye" size={12} color={theme.colors.textSecondary} />
      <Text
        style={[
          theme.typography.label,
          { color: theme.colors.textPrimary, marginLeft: theme.spacing.xs },
        ]}
      >
        {formatCount(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
});
