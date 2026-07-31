import { Image, StyleSheet, Text, View } from 'react-native';

import { palette, useTheme } from '@/theme';

// Drawn from the app's own accent palette plus a couple of complementary
// hues, so generated avatars feel like part of the same system rather than
// arbitrary colors.
const AVATAR_COLORS = [
  palette.purple,
  palette.pink,
  palette.blue,
  palette.emerald,
  '#F59E0B',
  '#14B8A6',
] as const;

function colorForName(name: string): string {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? palette.purple;
}

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const theme = useTheme();
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };
  const ringStyle = {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.glassBorder,
  };

  if (uri) {
    return <Image source={{ uri }} style={[dimensionStyle, ringStyle]} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.placeholder,
        dimensionStyle,
        ringStyle,
        { backgroundColor: colorForName(name) },
      ]}
    >
      <Text
        style={[
          theme.typography.bodyStrong,
          { color: theme.colors.textPrimary, fontSize: size * 0.4 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
