import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components';
import { useTheme } from '@/theme';

const DEFAULT_CATEGORY = 'General';

export interface GoLiveInput {
  title: string;
  category: string;
}

interface GoLiveModalProps {
  visible: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: GoLiveInput) => void;
}

// Lightweight bottom-sheet-style modal, not a routed screen — Creator is
// the only place this is used, and it needs no navigation/back-stack
// behavior of its own (see app/(tabs)/creator.tsx).
export function GoLiveModal({
  visible,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: GoLiveModalProps) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const trimmedTitle = title.trim();
  const isValid = trimmedTitle.length > 0;
  const canSubmit = isValid && !isSubmitting;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ title: trimmedTitle, category: category.trim() || DEFAULT_CATEGORY });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlayStrong }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderTopLeftRadius: theme.radius.xxl,
                borderTopRightRadius: theme.radius.xxl,
                padding: theme.spacing.md,
                ...theme.shadows.xl,
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.glassBorder, marginBottom: theme.spacing.sm },
              ]}
            />
            <Text style={[theme.typography.heading1, { color: theme.colors.textPrimary }]}>
              Go Live
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
              ]}
            >
              Give your stream a title before you start broadcasting.
            </Text>

            <View style={{ marginTop: theme.spacing.md }}>
              <Text
                style={[
                  theme.typography.label,
                  { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
                ]}
              >
                Stream Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What are you streaming today?"
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel="Stream title"
                autoFocus
                returnKeyType="next"
                style={[
                  theme.typography.body,
                  styles.input,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.glassBorder,
                    borderRadius: theme.radius.lg,
                    paddingHorizontal: theme.spacing.sm,
                  },
                ]}
              />
            </View>

            <View style={{ marginTop: theme.spacing.sm }}>
              <Text
                style={[
                  theme.typography.label,
                  { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
                ]}
              >
                Category (optional)
              </Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder={DEFAULT_CATEGORY}
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel="Category"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={[
                  theme.typography.body,
                  styles.input,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.glassBorder,
                    borderRadius: theme.radius.lg,
                    paddingHorizontal: theme.spacing.sm,
                  },
                ]}
              />
            </View>

            {errorMessage ? (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.danger, marginTop: theme.spacing.sm },
                ]}
              >
                {errorMessage}
              </Text>
            ) : null}

            <View style={{ marginTop: theme.spacing.md }}>
              <PrimaryButton
                label={isSubmitting ? 'Starting...' : 'Start Stream'}
                onPress={handleSubmit}
                disabled={!canSubmit}
              />
              <View style={{ marginTop: theme.spacing.xs }}>
                <SecondaryButton label="Cancel" onPress={handleClose} disabled={isSubmitting} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  avoider: { width: '100%' },
  sheet: {},
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  input: { height: 52, borderWidth: StyleSheet.hairlineWidth },
});
