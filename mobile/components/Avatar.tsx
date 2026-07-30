import { Image, StyleSheet, Text, View } from 'react-native';

import { palette, useTheme } from '@/theme';

const AVATAR_COLORS = [
  palette.accent,
  '#E67E22',
  '#16A085',
  '#2980B9',
  '#C0392B',
  '#8E44AD',
] as const;

function colorForName(name: string): string {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? palette.accent;
}

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const theme = useTheme();
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={dimensionStyle} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.placeholder, dimensionStyle, { backgroundColor: colorForName(name) }]}>
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
