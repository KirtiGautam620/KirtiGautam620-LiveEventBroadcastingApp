import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import type { Message } from '@/types/database';

interface ChatMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

function ChatMessageBubbleComponent({ message, isOwnMessage }: ChatMessageBubbleProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          marginBottom: theme.spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.overlay,
            borderRadius: theme.radius.md,
            padding: theme.spacing.sm,
          },
        ]}
      >
        <Text style={[theme.typography.caption, { color: theme.colors.textPrimary }]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// Renders once per list item — avoiding re-renders when sibling messages
// change (e.g. a new message appended elsewhere in the list) is a real win
// here, not decorative.
export const ChatMessageBubble = memo(ChatMessageBubbleComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  bubble: { maxWidth: '80%' },
});
