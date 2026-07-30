import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { PrimaryButton, ScreenContainer } from '@/components';
import { useUpdateDisplayName } from '@/hooks';
import { useTheme } from '@/theme';

const MIN_LENGTH = 3;
const MAX_LENGTH = 25;

interface DisplayNameScreenProps {
  userId: string;
}

// Blocking, one-time onboarding step: rendered by the root AuthGate in
// place of the app's normal navigator whenever the signed-in user's
// profile has no display_name yet. Once the save succeeds, the profile
// query cache is updated (see useUpdateDisplayName) and AuthGate re-renders
// past this screen on its own — there's no navigation call here.
export function DisplayNameScreen({ userId }: DisplayNameScreenProps) {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const updateDisplayName = useUpdateDisplayName(userId);

  const trimmed = displayName.trim();
  const validationError = useMemo(() => {
    if (trimmed.length === 0) return 'Enter a display name.';
    if (trimmed.length < MIN_LENGTH) return `Must be at least ${MIN_LENGTH} characters.`;
    if (trimmed.length > MAX_LENGTH) return `Must be ${MAX_LENGTH} characters or fewer.`;
    return null;
  }, [trimmed]);

  const isValid = validationError === null;
  const canSubmit = isValid && !updateDisplayName.isPending;

  const handleSubmit = () => {
    setIsTouched(true);
    if (!isValid || updateDisplayName.isPending) return;
    updateDisplayName.mutate(trimmed);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={{ paddingHorizontal: theme.spacing.lg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(450)}>
            <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>
              Welcome!
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
              ]}
            >
              Choose the name people will see when you go live.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(450).delay(100)}
            style={{ marginTop: theme.spacing.xxl }}
          >
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
              ]}
            >
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              onBlur={() => setIsTouched(true)}
              placeholder="e.g. Alex Rivera"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={MAX_LENGTH + 10}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={[
                theme.typography.body,
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor:
                    isTouched && validationError ? theme.colors.danger : theme.colors.border,
                  borderRadius: theme.radius.lg,
                  paddingHorizontal: theme.spacing.lg,
                },
              ]}
            />
            {isTouched && validationError ? (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.danger, marginTop: theme.spacing.sm },
                ]}
              >
                {validationError}
              </Text>
            ) : null}
            {updateDisplayName.isError ? (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.danger, marginTop: theme.spacing.sm },
                ]}
              >
                {"Couldn't save your name. Please try again."}
              </Text>
            ) : null}
          </Animated.View>
        </View>

        <View style={{ paddingBottom: theme.spacing.xl }}>
          <PrimaryButton
            label={updateDisplayName.isPending ? 'Saving...' : 'Continue'}
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center' },
  input: { height: 52, borderWidth: StyleSheet.hairlineWidth },
});
