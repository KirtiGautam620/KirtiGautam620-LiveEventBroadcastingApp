import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Avatar } from '@/components';
import type { ChatDisplayMessage } from '@/hooks/useChat';
import { useTheme } from '@/theme';

interface ChatMessageBubbleProps {
  message: ChatDisplayMessage;
  isOwnMessage: boolean;
  // Purely presentational — highlights a message from the stream's
  // creator distinctly from other viewers. Optional so existing callers
  // that don't have it handy keep working unchanged.
  isCreatorMessage?: boolean;
}

// message.sender is joined by the repository (see MessageWithSender) — the
// display_name is never a raw id. Falls back to "Creator" only if the
// sender's profile has no display_name, which shouldn't normally happen
// (onboarding requires one) but can for older data.
function getDisplayName(message: ChatDisplayMessage, isOwnMessage: boolean): string {
  if (isOwnMessage) return 'You';
  return message.sender?.display_name?.trim() || 'Creator';
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatMessageBubbleComponent({
  message,
  isOwnMessage,
  isCreatorMessage = false,
}: ChatMessageBubbleProps) {
  const theme = useTheme();
  const displayName = getDisplayName(message, isOwnMessage);
  const highlightCreator = isCreatorMessage && !isOwnMessage;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[
        styles.row,
        {
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          marginBottom: theme.spacing.md,
          // Not-yet-synced messages read as visibly "in flight" rather
          // than indistinguishable from a confirmed message.
          opacity: message.pending ? 0.6 : 1,
        },
      ]}
    >
      <Avatar name={displayName} size={32} />

      <View
        style={[
          styles.column,
          {
            marginHorizontal: theme.spacing.xs,
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
          <Text
            style={[
              theme.typography.username,
              { color: highlightCreator ? theme.colors.accentPink : theme.colors.textSecondary },
            ]}
          >
            {displayName}
            {highlightCreator ? ' · Host' : ''}
          </Text>
          <Text
            style={[
              theme.typography.micro,
              { color: theme.colors.textMuted, marginHorizontal: theme.spacing.xs },
            ]}
          >
            {message.pending ? 'Sending…' : formatTimestamp(message.created_at)}
          </Text>
        </View>

        <View
          style={{
            // Own messages get a tinted accent background so a sender can
            // spot their own messages at a glance — a single flat color
            // for every bubble otherwise reads as an undifferentiated
            // wall of text. Creator messages (not own) get a subtle pink
            // border instead of a fill, so the highlight reads as a badge
            // rather than competing with the "this is mine" tint.
            backgroundColor: isOwnMessage ? theme.colors.accentMuted : theme.colors.overlay,
            borderRadius: theme.radius.bubble,
            // One corner squared off toward the message's own edge — a
            // common chat-bubble "tail" cue instead of a uniform pill.
            borderBottomRightRadius: isOwnMessage ? theme.radius.sm : theme.radius.bubble,
            borderBottomLeftRadius: isOwnMessage ? theme.radius.bubble : theme.radius.sm,
            borderWidth: highlightCreator ? 1 : StyleSheet.hairlineWidth,
            borderColor: highlightCreator ? 'rgba(236, 72, 153, 0.45)' : theme.colors.glassBorder,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
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
  column: { maxWidth: '72%' },
  header: { alignItems: 'baseline' },
});
