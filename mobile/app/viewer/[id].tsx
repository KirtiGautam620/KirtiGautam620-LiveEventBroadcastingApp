import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorView, LoadingView, ViewerCountBadge } from '@/components';
import { ChatPanel } from '@/features/chat';
import { usePresence, useStream } from '@/hooks';
import { useTheme } from '@/theme';

// Video area stays a placeholder (gradient background). No offline queue,
// optimistic UI, or reconnect-sync logic implemented. Viewer count is real
// (Realtime Presence, Step 9); chat is real (Realtime Postgres Changes,
// Step 10).
export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { data: stream, isPending, isError, refetch } = useStream(id);
  const presence = usePresence(id);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={['#341F97', '#0A0A0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View
          style={[
            styles.topRow,
            { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.sm },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              { backgroundColor: theme.colors.overlay, borderRadius: theme.radius.full },
            ]}
          >
            <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>
              ←
            </Text>
          </Pressable>
          <ViewerCountBadge count={presence.viewerCount} />
        </View>

        {isPending ? (
          <LoadingView message="Loading stream..." />
        ) : isError ? (
          <ErrorView
            title="Couldn't load stream"
            description="Something went wrong while loading this stream."
            actionLabel="Retry"
            onAction={() => void refetch()}
          />
        ) : !stream ? (
          <View style={styles.centeredContent}>
            <EmptyState
              title="Stream not found"
              description="This stream may have ended or the link is invalid."
            />
          </View>
        ) : (
          <>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.lg },
              ]}
            >
              {stream.title}
            </Text>

            <View style={styles.chatArea}>
              <ChatPanel streamId={stream.id} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  centeredContent: { flex: 1, justifyContent: 'center' },
  chatArea: { flex: 1 },
});
