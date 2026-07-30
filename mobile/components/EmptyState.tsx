import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: theme.spacing.xxl }]}>
      <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, textAlign: 'center' },
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
});
