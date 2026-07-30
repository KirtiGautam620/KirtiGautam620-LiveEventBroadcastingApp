import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Avatar } from '@/components';
import { useTheme } from '@/theme';
import type { Message } from '@/types/database';

interface ChatMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

// There's no sender profile join available here (messages only carry
// sender_id — adding a profile join is a repository change, out of scope
// for a UI-only pass), so the display name is derived from the real
// sender_id rather than inventing a name.
function getDisplayName(senderId: string | null, isOwnMessage: boolean): string {
  if (isOwnMessage) return 'You';
  if (!senderId) return 'Viewer';
  return `Viewer ${senderId.slice(0, 4).toUpperCase()}`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatMessageBubbleComponent({ message, isOwnMessage }: ChatMessageBubbleProps) {
  const theme = useTheme();
  const displayName = getDisplayName(message.sender_id, isOwnMessage);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[
        styles.row,
        {
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          marginBottom: theme.spacing.lg,
        },
      ]}
    >
      <Avatar name={displayName} size={32} />

      <View
        style={[
          styles.column,
          {
            marginHorizontal: theme.spacing.sm,
            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View
          style={[
            styles.header,
            { flexDirection: isOwnMessage ? 'row-reverse' : 'row', marginBottom: theme.spacing.xs },
          ]}
        >
          <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
            {displayName}
          </Text>
          <Text
            style={[
              styles.timestamp,
              {
                color: theme.colors.textMuted,
                marginHorizontal: theme.spacing.xs,
              },
            ]}
          >
            {formatTimestamp(message.created_at)}
          </Text>
        </View>

        <View
          style={{
            // Own messages get a tinted accent background so a sender can
            // spot their own messages at a glance — a single flat color
            // for every bubble otherwise reads as an undifferentiated
            // wall of text.
            backgroundColor: isOwnMessage ? theme.colors.accentMuted : theme.colors.overlay,
            borderRadius: theme.radius.xl,
            // One corner squared off toward the message's own edge — a
            // common chat-bubble "tail" cue instead of a uniform pill.
            borderBottomRightRadius: isOwnMessage ? theme.radius.sm : theme.radius.xl,
            borderBottomLeftRadius: isOwnMessage ? theme.radius.xl : theme.radius.sm,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            ...theme.shadows.sm,
          }}
        >
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
            {message.content}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Renders once per list item — avoiding re-renders when sibling messages
// change (e.g. a new message appended elsewhere in the list) is a real win
// here, not decorative.
export const ChatMessageBubble = memo(ChatMessageBubbleComponent);

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start' },
  column: { maxWidth: '70%' },
  header: { alignItems: 'baseline' },
  // 13px/11px don't exist in the theme's font-size scale — the design spec
  // for this screen calls for these exact sizes, closer together than the
  // scale's existing steps allow.
  username: { fontSize: 13, fontWeight: '500' },
  timestamp: { fontSize: 11 },
});
