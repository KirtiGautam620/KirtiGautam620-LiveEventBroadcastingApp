import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState, ErrorView, LoadingView } from '@/components';
import { useChat } from '@/hooks';
import { useTheme } from '@/theme';
import type { Message } from '@/types/database';

import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatPanelProps {
  streamId: string;
}

function ChatPanelComponent({ streamId }: ChatPanelProps) {
  const theme = useTheme();
  const { messages, currentUserId, isLoading, isError, refetch, sendMessage, isSending } =
    useChat(streamId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlashListRef<Message>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => (
      <ChatMessageBubble message={item} isOwnMessage={item.sender_id === currentUserId} />
    ),
    [currentUserId],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // FlashList recycles/measures based on prop identity more aggressively
  // than a plain View — a fresh object every render here is worth avoiding.
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm }),
    [theme.spacing.md, theme.spacing.sm],
  );

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
  }, [draft, sendMessage]);

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
          />
        ) : messages.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState title="No messages yet" description="Be the first to say something." />
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
          />
        )}
      </View>

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.colors.overlay,
            borderRadius: theme.radius.full,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            marginHorizontal: theme.spacing.md,
            marginTop: theme.spacing.sm,
          },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Say something..."
          placeholderTextColor={theme.colors.textMuted}
          style={[theme.typography.body, { color: theme.colors.textPrimary, flex: 1 }]}
          editable={!isSending}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.full,
              opacity: canSend ? 1 : 0.5,
            },
          ]}
        >
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Props are a single primitive (streamId) — memoizing avoids re-rendering
// the whole chat tree (list + input) when the parent screen re-renders for
// unrelated reasons.
export const ChatPanel = memo(ChatPanelComponent);

const styles = StyleSheet.create({
  container: { flex: 1 },
  listArea: { flex: 1 },
  emptyWrapper: { flex: 1, justifyContent: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'center' },
  sendButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
