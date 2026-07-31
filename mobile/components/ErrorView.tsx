import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

import { PrimaryButton } from './PrimaryButton';

const ICON_CIRCLE_SIZE = 64;

interface ErrorViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ErrorView({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'alert-circle-outline',
}: ErrorViewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { padding: theme.spacing.lg }]}>
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
        <Ionicons name={icon} size={28} color={theme.colors.danger} />
      </View>
      <Text
        style={[
          theme.typography.heading2,
          { color: theme.colors.textPrimary, textAlign: 'center' },
        ]}
      >
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
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.lg, alignSelf: 'stretch' }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
