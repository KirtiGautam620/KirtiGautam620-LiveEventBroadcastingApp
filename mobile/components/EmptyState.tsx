import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

const ICON_CIRCLE_SIZE = 64;

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: theme.spacing.xl }]}>
      {icon ? (
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          <Ionicons name={icon} size={28} color={theme.colors.textSecondary} />
        </View>
      ) : null}
      <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>{title}</Text>
      {description ? (
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xs,
              textAlign: 'center',
            },
          ]}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
