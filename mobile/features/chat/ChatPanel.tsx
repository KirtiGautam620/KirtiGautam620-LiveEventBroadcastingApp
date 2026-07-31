import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AnimatedPressable, EmptyState, ErrorView, LoadingView } from '@/components';
import { useChat, type ChatDisplayMessage } from '@/hooks';
import { useTheme } from '@/theme';

import { ChatMessageBubble } from './ChatMessageBubble';
import { useAutoScrollToEnd } from './useAutoScrollToEnd';

interface ChatPanelProps {
  streamId: string;
  // Purely presentational — lets ChatMessageBubble highlight a message
  // from the stream's creator distinctly from other viewers. Optional so
  // existing callers that don't have it handy keep working unchanged.
  creatorId?: string | null;
}

function ChatPanelComponent({ streamId, creatorId }: ChatPanelProps) {
  const theme = useTheme();
  const { messages, currentUserId, isLoading, isError, refetch, sendMessage, isSending } =
    useChat(streamId);
  const [draft, setDraft] = useState('');
  // Presentation-only: highlights the input on focus. Doesn't touch the
  // chat send/receive flow.
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { listRef, handleScroll } = useAutoScrollToEnd(messages, currentUserId);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatDisplayMessage>) => (
      <ChatMessageBubble
        message={item}
        isOwnMessage={item.sender_id === currentUserId}
        isCreatorMessage={creatorId != null && item.sender_id === creatorId}
      />
    ),
    [currentUserId, creatorId],
  );

  const keyExtractor = useCallback((item: ChatDisplayMessage) => item.id, []);

  // FlashList recycles/measures based on prop identity more aggressively
  // than a plain View — a fresh object every render here is worth avoiding.
  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
    }),
    [theme.spacing.sm, theme.spacing.xs],
  );

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  }, [draft, sendMessage]);

  const handleFocus = useCallback(() => setIsInputFocused(true), []);
  const handleBlur = useCallback(() => setIsInputFocused(false), []);

  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      <View style={styles.listArea}>
        {isLoading ? (
          <LoadingView message="Loading chat..." />
        ) : isError ? (
          <ErrorView
            title="Couldn't load chat"
            description="Something went wrong while loading messages."
            actionLabel="Retry"
            onAction={() => void refetch()}
            icon="chatbubble-ellipses-outline"
          />
        ) : messages.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              title="No messages yet"
              description="Be the first to say something."
              icon="chatbubble-outline"
            />
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
            onScroll={handleScroll}
            scrollEventThrottle={100}
          />
        )}
      </View>

      {/* Sticky input bar — always the last element in this flex:1 column,
          so it stays pinned to the bottom of the chat panel regardless of
          message count. */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.colors.overlay,
            borderRadius: theme.radius.full,
            borderWidth: isInputFocused ? 1.5 : StyleSheet.hairlineWidth,
            borderColor: isInputFocused ? theme.colors.accent : theme.colors.glassBorder,
            paddingHorizontal: theme.spacing.sm,
            marginHorizontal: theme.spacing.sm,
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.xs,
            ...(isInputFocused ? theme.shadows.sm : null),
          },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Say something..."
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Message"
          style={[theme.typography.body, { color: theme.colors.textPrimary, flex: 1 }]}
          editable={!isSending}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <AnimatedPressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          // Same fix as LiveChatOverlay's send button: this Pressable sits
          // flush against the TextInput's right edge, so a uniform hitSlop
          // steals taps from the input's own bounds on its left side.
          hitSlop={{ top: 8, bottom: 8, right: 8, left: 0 }}
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.full,
              opacity: canSend ? 1 : 0.4,
              ...(canSend ? theme.shadows.sm : null),
            },
          ]}
        >
          <Ionicons name="send" size={16} color={theme.colors.textPrimary} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

// Props are a couple of primitives — memoizing avoids re-rendering the
// whole chat tree (list + input) when the parent screen re-renders for
// unrelated reasons.
export const ChatPanel = memo(ChatPanelComponent);

const styles = StyleSheet.create({
  container: { flex: 1 },
  listArea: { flex: 1 },
  emptyWrapper: { flex: 1, justifyContent: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'center', height: 48 },
  sendButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
