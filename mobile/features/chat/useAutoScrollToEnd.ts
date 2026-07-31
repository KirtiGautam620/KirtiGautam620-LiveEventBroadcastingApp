import type { FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const BOTTOM_THRESHOLD_PX = 48;

interface AutoScrollableMessage {
  id: string;
  sender_id: string | null;
}

// Shared by ChatPanel and LiveChatOverlay: mirrors Instagram/YouTube Live —
// new messages only pull the view down to the bottom if the viewer hasn't
// scrolled up to read earlier ones, except for the viewer's own just-sent
// message, which always scrolls into view regardless of scroll position.
export function useAutoScrollToEnd<T extends AutoScrollableMessage>(
  messages: T[],
  currentUserId: string | null,
) {
  const listRef = useRef<FlashListRef<T>>(null);
  const isAtBottomRef = useRef(true);
  // The very first time messages populate (opening a stream that already
  // has chat history), landing on the newest message is still correct —
  // but doing it with an *animated* scroll is what actually reads as the
  // reported bug ("chat immediately jumps"). Everything after this first
  // positioning is a real new message arriving live, which should animate.
  const hasPositionedRef = useRef(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isAtBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD_PX;
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const isOwnMessage = last?.sender_id === currentUserId;
    if (isAtBottomRef.current || isOwnMessage) {
      listRef.current?.scrollToEnd({ animated: hasPositionedRef.current });
      hasPositionedRef.current = true;
    }
    // messages.length (not the array itself) mirrors the previous
    // per-screen implementations this hook replaces — a new message always
    // changes the length, and re-running per keystroke-sized content
    // mutations isn't a concern here (messages are append-only).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, currentUserId]);

  return { listRef, handleScroll };
}
