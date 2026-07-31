import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

// The bar's own visual content height, unrelated to the device's bottom
// inset — kept as a constant so it reads the same with or without a system
// nav bar to clear (see insets.bottom below).
const TAB_BAR_CONTENT_HEIGHT = 64;
const ICON_PILL_SIZE = 40;

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
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        // No real BlurView dependency in this project — approximated with
        // an elevated surface + hairline top border + soft shadow instead.
        // Deliberately NOT position: 'absolute': screens don't reserve
        // bottom padding for the bar, and an earlier pass had a real
        // Android edge-to-edge overlap bug from a similar bottom-inset
        // mismatch — keeping the bar in-flow avoids reintroducing it.
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceElevated,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom,
          ...theme.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.semibold,
          marginTop: theme.spacing.xs / 2,
        },
        tabBarItemStyle: {
          paddingVertical: theme.spacing.xs / 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon filled="compass" outline="compass-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="creator"
        options={{
          title: 'Creator',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon filled="videocam" outline="videocam-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  filled: keyof typeof Ionicons.glyphMap;
  outline: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}

// Active state reads as a soft rounded "pill" behind the icon (tinted with
// the accent color at low opacity) rather than just a tint-color swap —
// gives the bar a real active indicator instead of relying on label color
// alone.
function TabIcon({ filled, outline, color, focused }: TabIconProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: focused ? theme.colors.accentMuted : 'transparent',
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Ionicons name={focused ? filled : outline} size={22} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: ICON_PILL_SIZE,
    height: ICON_PILL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
