import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable, Avatar } from '@/components';
import { useAutoScrollToEnd } from '@/features/chat/useAutoScrollToEnd';
import { useChat, type ChatDisplayMessage } from '@/hooks';
import { useTheme } from '@/theme';

// TEMPORARY diagnostic logging (onFocus/onBlur below) — left in at the
// user's explicit request to verify empirically whether focus is being
// stolen immediately after being gained. Safe to delete once confirmed;
// does not affect behavior.
const DEBUG_FOCUS = true;

interface LiveChatOverlayProps {
  streamId: string;
  // Purely presentational — lets a message row highlight the stream's
  // creator distinctly from other viewers. Optional so this still renders
  // fine if the caller doesn't have it handy.
  creatorId?: string | null;
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

// Neutral glass tint for every bubble that isn't the current viewer's own
// message. Own messages use a translucent accent-purple tint instead of a
// flat fill so they still read as "glass" like every other bubble here.
const BUBBLE_BG = 'rgba(20, 20, 24, 0.6)';
const OWN_BUBBLE_BG = 'rgba(139, 92, 246, 0.32)';

interface MessageRowProps {
  message: ChatDisplayMessage;
  isCreatorMessage: boolean;
  isOwnMessage: boolean;
}

// Instagram-Live-style row: avatar + one inline text flow (bold username
// leading into the message) inside a translucent rounded bubble, so text
// stays legible over any video content behind it. Always avatar-left in a
// single-column feed (own messages are NOT mirrored to the right) — that's
// how Instagram Live's own overlay chat reads; "yours" is communicated by a
// tinted bubble, not a layout flip.
function MessageRowComponent({ message, isCreatorMessage, isOwnMessage }: MessageRowProps) {
  const theme = useTheme();
  const displayName = getDisplayName(message);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.messageRow, { marginBottom: theme.spacing.sm }]}
    >
      <Avatar name={displayName} size={28} />
      <View
        style={[
          styles.bubble,
          {
            marginLeft: theme.spacing.xs,
            borderRadius: theme.radius.bubble,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            backgroundColor: isOwnMessage ? OWN_BUBBLE_BG : BUBBLE_BG,
            borderWidth: isCreatorMessage ? 1 : StyleSheet.hairlineWidth,
            borderColor: isCreatorMessage ? 'rgba(236, 72, 153, 0.5)' : 'rgba(255, 255, 255, 0.14)',
            ...theme.shadows.sm,
            // Not-yet-synced messages read as visibly "in flight" rather
            // than indistinguishable from a confirmed one.
            opacity: message.pending ? 0.6 : 1,
          },
        ]}
      >
        <Text style={styles.messageText}>
          <Text style={[styles.username, isCreatorMessage && { color: theme.colors.accentPink }]}>
            {isOwnMessage ? 'You' : displayName}
            {isCreatorMessage ? ' · Host' : ''}{' '}
          </Text>
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

function LiveChatOverlayComponent({ streamId, creatorId }: LiveChatOverlayProps) {
  const theme = useTheme();
  const { messages, currentUserId, isLoading, sendMessage, isSending } = useChat(streamId);
  const [draft, setDraft] = useState('');
  // Presentational only — highlights the input's glass border on focus.
  // Doesn't touch the send/receive flow. A Reanimated shared value, not
  // React state: driving this via setState caused a JS re-render (changing
  // inputPill's borderWidth/shadow) on the exact same frame the keyboard
  // was opening and KeyboardAvoidingView was already reflowing the layout
  // to make room for it — two layout-affecting changes landing on top of a
  // just-granted native focus, which is what was causing the immediate
  // blur (confirmed via mount/unmount logging: neither ViewerScreen nor
  // LiveChatOverlay was ever unmounting, so the blur wasn't a remount).
  // Mutating a shared value from onFocus/onBlur updates the UI thread
  // directly and never touches the React render cycle at all.
  //
  // borderWidth is deliberately NOT part of this (or animated at all, or
  // ever state-driven) — border width is a layout-affecting property
  // (Yoga includes it in the box model), so changing it — even via a
  // worklet, even smoothly over time — makes the TextInput's direct
  // parent relayout on every frame of the transition. That was landing
  // exactly in the window where the OS commits the keyboard-show request,
  // and is the most likely explanation for keyboardDidShow never firing:
  // continuous relayout of the just-focused view's container during that
  // window. borderWidth is now a constant in the static style below;
  // only borderColor and the shadow (both purely visual, no layout
  // participation) still change on focus, and only via this worklet.
  const inputFocus = useSharedValue(0);
  const inputPillAnimatedStyle = useAnimatedStyle(() => {
    const focused = inputFocus.value > 0.5;
    return {
      borderColor: focused ? theme.colors.accent : 'rgba(255, 255, 255, 0.2)',
      ...(focused ? theme.shadows.sm : null),
    };
  });
  const { listRef, handleScroll } = useAutoScrollToEnd(messages, currentUserId);

  // TEMPORARY diagnostic — determines whether this component itself is
  // being unmounted/remounted (as opposed to just re-rendering) while the
  // user is interacting with the input. Safe to delete once confirmed.
  useEffect(() => {
    console.log('[LiveChatOverlay] mounted', { streamId });
    return () => console.log('[LiveChatOverlay] unmounted', { streamId });
  }, [streamId]);

  // TEMPORARY diagnostic — correlates the native keyboard's own show/hide
  // lifecycle with the TextInput's onFocus/onBlur timestamps. Two prior
  // fixes (a hitSlop dead zone, then moving focus-driven styling off the
  // React render path) each addressed a real, verified defect but neither
  // stopped the immediate blur, so the remaining open question is whether
  // the keyboard itself is closing when the blur happens (points at
  // KeyboardAvoidingView/layout) or whether the keyboard stays open while
  // only React-level focus is lost (a different bug entirely). Safe to
  // delete once that's answered.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      console.log('[LiveChatOverlay] keyboardDidShow', Date.now());
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      console.log('[LiveChatOverlay] keyboardDidHide', Date.now());
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChatDisplayMessage>) => (
      <MessageRow
        message={item}
        isCreatorMessage={creatorId != null && item.sender_id === creatorId}
        isOwnMessage={item.sender_id === currentUserId}
      />
    ),
    [creatorId, currentUserId],
  );
  const keyExtractor = useCallback((item: ChatDisplayMessage) => item.id, []);
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.xs }),
    [theme.spacing.sm, theme.spacing.xs],
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
            // Default is 'never', which dismisses the keyboard (swallowing
            // that touch) on any tap inside the list's bounds while the
            // keyboard is open — the message list sits directly above the
            // input, so a tap that's a few pixels off from where the user
            // meant to land can eat a tap that should have reached the
            // input's focus/reopen instead.
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : null}

      <View
        style={[
          styles.inputRow,
          { paddingHorizontal: theme.spacing.sm, marginTop: theme.spacing.xs },
        ]}
      >
        <Animated.View
          style={[
            styles.inputPill,
            { backgroundColor: theme.colors.overlayStrong },
            inputPillAnimatedStyle,
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => {
              if (DEBUG_FOCUS) console.log('[LiveChatOverlay] TextInput onFocus', Date.now());
              inputFocus.value = withTiming(1, { duration: 150 });
            }}
            onBlur={() => {
              if (DEBUG_FOCUS) console.log('[LiveChatOverlay] TextInput onBlur', Date.now());
              inputFocus.value = withTiming(0, { duration: 150 });
            }}
            placeholder="Send a message..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            accessibilityLabel="Message"
            style={styles.input}
            editable={!isSending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <AnimatedPressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            // Not a uniform number: this button sits flush against the
            // TextInput's right edge with zero gap between them. A uniform
            // hitSlop expands touchable area on ALL sides, including left
            // — straight into the TextInput's own rendered bounds. Since
            // this Pressable paints after (on top of) the TextInput in the
            // same stacking context, any tap landing in that overlap strip
            // is silently stolen by the send button instead of focusing
            // the input. Omitting `left` removes the overlap entirely
            // while keeping the larger touch target on the other 3 sides.
            hitSlop={{ top: 8, bottom: 8, right: 8, left: 0 }}
            style={[
              styles.sendButton,
              {
                backgroundColor: theme.colors.accent,
                opacity: canSend ? 1 : 0.4,
                ...(canSend ? theme.shadows.sm : null),
              },
            ]}
          >
            <Ionicons name="send" size={16} color={theme.colors.textPrimary} />
          </AnimatedPressable>
        </Animated.View>
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
  bubble: { flexShrink: 1 },
  messageText: { flexShrink: 1, lineHeight: 20 },
  username: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  messageBody: { color: '#FFFFFF', fontSize: 14, fontWeight: '400' },
  timestamp: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 11 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    // Constant regardless of focus — see the comment above
    // inputPillAnimatedStyle for why this must never change value.
    borderWidth: 1.5,
  },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
