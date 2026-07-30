import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AnimatedPressable, Avatar } from '@/components';
import { useChat } from '@/hooks';
import { useTheme } from '@/theme';
import type { Message } from '@/types/database';

interface LiveChatOverlayProps {
  streamId: string;
}

// There's no sender-profile join available here (messages only carry
// sender_id — adding one is a repository change, out of scope for a
// UI-only pass), so the display name is derived from the real sender_id
// rather than inventing one. Not shared with features/chat/ChatMessageBubble
// on purpose — this screen no longer uses that component at all.
function getDisplayName(senderId: string | null): string {
  if (!senderId) return 'Viewer';
  return `Viewer ${senderId.slice(0, 4).toUpperCase()}`;
}

// Roughly the lower third of the screen — chat overlays the video but must
// never take over the whole frame. FlashList needs a *definite* height from
// its parent to render anything at all (it doesn't self-size to content,
// unlike a plain View) — this must be a fixed height, not a maxHeight cap,
// or the list renders into a 0px viewport and every message stays invisible.
const MESSAGES_LIST_HEIGHT = Math.round(Dimensions.get('window').height * 0.32);

interface MessageRowProps {
  message: Message;
}

// Instagram-Live-style row: avatar + one inline text flow (bold username
// leading into the message), not a separate bubble.
function MessageRowComponent({ message }: MessageRowProps) {
  const theme = useTheme();
  const displayName = getDisplayName(message.sender_id);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.messageRow, { marginBottom: theme.spacing.sm }]}
    >
      <Avatar name={displayName} size={30} />
      <Text style={[styles.messageText, { marginLeft: theme.spacing.sm }]}>
        <Text style={styles.username}>{displayName} </Text>
        <Text style={styles.messageBody}>{message.content}</Text>
      </Text>
    </Animated.View>
  );
}

const MessageRow = memo(MessageRowComponent);

function LiveChatOverlayComponent({ streamId }: LiveChatOverlayProps) {
  const theme = useTheme();
  const { messages, isLoading, sendMessage, isSending } = useChat(streamId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlashListRef<Message>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => <MessageRow message={item} />,
    [],
  );
  const keyExtractor = useCallback((item: Message) => item.id, []);
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

        {/* Placeholder actions only — no functionality, so these are plain
            (non-pressable) views rather than buttons that would do nothing
            when tapped. */}
        <View style={[styles.iconButton, { marginLeft: theme.spacing.sm }]}>
          <Text style={styles.icon}>❤️</Text>
        </View>
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
  messageRow: { flexDirection: 'row', alignItems: 'flex-start' },
  messageText: { flex: 1, flexShrink: 1 },
  username: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  messageBody: { color: '#FFFFFF', fontSize: 13, fontWeight: '400' },
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
