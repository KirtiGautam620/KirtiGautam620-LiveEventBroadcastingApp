import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

// Note: tabBarStyle/tabBarLabelStyle/tabBarItemStyle here are the bottom
// nav's only styling surface — they apply to both tabs since this is the
// shared navigator chrome, not a per-screen file. Presentation only: no
// options besides visual style/title were touched.
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60,
          paddingTop: theme.spacing.sm,
          ...theme.shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium,
        },
        tabBarItemStyle: {
          paddingVertical: theme.spacing.xs,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Browse' }} />
      <Tabs.Screen name="creator" options={{ title: 'Creator' }} />
    </Tabs>
  );
}
