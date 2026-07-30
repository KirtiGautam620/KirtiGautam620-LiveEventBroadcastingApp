import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

import { PrimaryButton } from './PrimaryButton';

interface ErrorViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorView({ title, description, actionLabel, onAction }: ErrorViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, padding: theme.spacing.lg },
      ]}
    >
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
            theme.typography.body,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
