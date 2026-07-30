import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AnimatedPressable, Avatar } from '@/components';
import { useAutoScrollToEnd } from '@/features/chat/useAutoScrollToEnd';
import { useChat, type ChatDisplayMessage } from '@/hooks';
import { useTheme } from '@/theme';

interface LiveChatOverlayProps {
  streamId: string;
}

// message.sender is joined by the repository (see MessageWithSender) — the
// display_name is never a raw id. Falls back to "Creator" only if the
// sender's profile has no display_name, which shouldn't normally happen
// (onboarding requires one) but can for older data or a not-yet-synced
// pending message (see toDisplayMessage in useChat.ts).
function getDisplayName(message: ChatDisplayMessage): string {
  return message.sender?.display_name?.trim() || 'Creator';
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Roughly the lower third of the screen — chat overlays the video but must
// never take over the whole frame. FlashList needs a *definite* height from
// its parent to render anything at all (it doesn't self-size to content,
// unlike a plain View) — this must be a fixed height, not a maxHeight cap,
// or the list renders into a 0px viewport and every message stays invisible.
const MESSAGES_LIST_HEIGHT = Math.round(Dimensions.get('window').height * 0.32);

interface MessageRowProps {
  message: ChatDisplayMessage;
}

// Instagram-Live-style row: avatar + one inline text flow (bold username
// leading into the message) inside a translucent rounded bubble, so text
// stays legible over any video content behind it.
function MessageRowComponent({ message }: MessageRowProps) {
  const theme = useTheme();
  const displayName = getDisplayName(message);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.messageRow, { marginBottom: theme.spacing.md }]}
    >
      <Avatar name={displayName} size={28} />
      <View
        style={[
          styles.bubble,
          {
            marginLeft: theme.spacing.sm,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            // Not-yet-synced messages read as visibly "in flight" rather
            // than indistinguishable from a confirmed one.
            opacity: message.pending ? 0.6 : 1,
          },
        ]}
      >
        <Text style={styles.messageText}>
          <Text style={styles.username}>{displayName} </Text>
          <Text style={styles.messageBody}>{message.content}</Text>
        </Text>
        <Text style={[styles.timestamp, { marginTop: theme.spacing.xs / 2 }]}>
          {message.pending ? 'Sending…' : formatTimestamp(message.created_at)}
        </Text>
      </View>
    </Animated.View>
  );
}

const MessageRow = memo(MessageRowComponent);

function LiveChatOverlayComponent({ streamId }: LiveChatOverlayProps) {
  const theme = useTheme();
  const { messages, currentUserId, isLoading, sendMessage, isSending } = useChat(streamId);
  const [draft, setDraft] = useState('');
  const { listRef, handleScroll } = useAutoScrollToEnd(messages, currentUserId);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatDisplayMessage>) => <MessageRow message={item} />,
    [],
  );
  const keyExtractor = useCallback((item: ChatDisplayMessage) => item.id, []);
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }),
    [theme.spacing.lg, theme.spacing.sm],
  );

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  }, [draft, sendMessage]);

  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      {/* No loading/error UI here — a chat overlay that never received any
          messages yet should stay invisible over the video, not show a
          normal chat-screen banner. The input below still always works. */}
      {!isLoading && messages.length > 0 ? (
        <View style={{ height: MESSAGES_LIST_HEIGHT }}>
          <FlashList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
            onScroll={handleScroll}
            scrollEventThrottle={100}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.inputRow,
          { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm },
        ]}
      >
        <View
          style={[
            styles.inputPill,
            { backgroundColor: theme.colors.overlay, borderColor: 'rgba(255, 255, 255, 0.25)' },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Send a message..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={styles.input}
            editable={!isSending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <AnimatedPressable
            onPress={handleSend}
            disabled={!canSend}
            style={[styles.sendButton, { opacity: canSend ? 1 : 0.4 }]}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </AnimatedPressable>
        </View>

        {/* Placeholder action only — no functionality, so it's a plain
            (non-pressable) view rather than a button that would do nothing
            when tapped. The heart reaction now lives in HeartReactions,
            floating independently over the video (see viewer/[id].tsx). */}
        <View style={[styles.iconButton, { marginLeft: theme.spacing.sm }]}>
          <Text style={styles.icon}>📤</Text>
        </View>
      </View>
    </View>
  );
}

// Single streamId prop — memoizing avoids re-rendering the whole overlay
// (list + input) when the parent screen re-renders for unrelated reasons.
export const LiveChatOverlay = memo(LiveChatOverlayComponent);

const styles = StyleSheet.create({
  container: {},
  messageRow: { flexDirection: 'row', alignItems: 'flex-end' },
  bubble: { flexShrink: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  messageText: { flexShrink: 1 },
  username: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  messageBody: { color: '#FFFFFF', fontSize: 13, fontWeight: '400' },
  timestamp: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 16,
    paddingRight: 6,
  },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  sendIcon: { color: '#FFFFFF', fontSize: 16 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  icon: { fontSize: 18 },
});
