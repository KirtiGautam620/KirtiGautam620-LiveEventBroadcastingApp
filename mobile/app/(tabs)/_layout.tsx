import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

// The bar's own visual content height, unrelated to the device's bottom
// inset — kept as a constant so it reads the same with or without a system
// nav bar to clear (see insets.bottom below).
const TAB_BAR_CONTENT_HEIGHT = 60;

// Note: tabBarStyle/tabBarLabelStyle/tabBarItemStyle here are the bottom
// nav's only styling surface — they apply to both tabs since this is the
// shared navigator chrome, not a per-screen file. Presentation only: no
// options besides visual style/title were touched.
export default function TabsLayout() {
  const theme = useTheme();
  // android.edgeToEdgeEnabled (app.json) draws the app behind Android's
  // system navigation bar (Back/Home/Recents) — the tab bar has to add
  // this inset itself. @react-navigation/bottom-tabs only does that
  // automatically when tabBarStyle has no explicit `height`; as soon as a
  // fixed height is set (below), that automatic bottom padding is gone,
  // which is exactly what left the tab bar sitting under the system bar.
  const insets = useSafeAreaInsets();

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
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom,
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="creator"
        options={{
          title: 'Creator',
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
