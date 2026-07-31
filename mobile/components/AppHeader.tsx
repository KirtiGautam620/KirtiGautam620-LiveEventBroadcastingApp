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
    // Horizontal insets are the caller's ScreenContainer's job, not this
    // component's — this only owns the title/subtitle block and the gap
    // beneath it.
    <View style={[styles.container, { paddingBottom: theme.spacing.md }]}>
      <View style={styles.titleBlock}>
        <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
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
  titleBlock: { flexShrink: 1 },
});
