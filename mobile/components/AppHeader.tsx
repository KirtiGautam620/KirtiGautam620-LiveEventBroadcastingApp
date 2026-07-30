import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },
      ]}
    >
      <View>
        <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.xs / 2 },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
