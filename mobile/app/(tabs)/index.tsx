import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppHeader, Card, EmptyState, ErrorView, LoadingView, ScreenContainer } from '@/components';
import { useStreams } from '@/hooks';
import { useTheme } from '@/theme';

import { StreamCard } from './_components/StreamCard';

// Design-system + navigation skeleton from Step 5, now wired to real data.
// No stream creation, chat, presence, or viewer-screen logic here — that's
// separate, later steps.
export default function BrowseScreen() {
  const theme = useTheme();
  const { data: streams, isPending, isError, refetch } = useStreams();
  const featuredStreams = streams?.slice(0, 3) ?? [];

  return (
    <ScreenContainer scroll>
      <AppHeader title="Live" subtitle="Discover what's happening right now" />

      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm }}>
        <Card>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            Search streams, creators...
          </Text>
        </Card>
      </View>

      {isPending ? (
        <LoadingView message="Loading streams..." />
      ) : isError ? (
        <ErrorView
          title="Couldn't load streams"
          description="Something went wrong while loading live streams."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : streams.length === 0 ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }}>
          <EmptyState
            title="No streams live right now"
            description="Check back soon, or start your own stream."
          />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: theme.spacing.xl }}>
            <Text
              style={[
                theme.typography.heading2,
                {
                  color: theme.colors.textPrimary,
                  paddingHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              Featured Live
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
            >
              {featuredStreams.map((stream, index) => (
                <StreamCard key={stream.id} stream={stream} index={index} featured />
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={{ marginTop: theme.spacing.xl, paddingHorizontal: theme.spacing.lg }}
          >
            <Text
              style={[
                theme.typography.heading2,
                { color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
              ]}
            >
              Live Now
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
              {streams.map((stream, index) => (
                <StreamCard key={stream.id} stream={stream} index={index} />
              ))}
            </View>
          </Animated.View>
        </>
      )}

      <View
        style={{
          marginTop: theme.spacing.xl,
          marginBottom: theme.spacing.xxl,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Text style={[theme.typography.heading2, { color: theme.colors.textPrimary }]}>
          Recently Watched
        </Text>
        <EmptyState title="No recent streams" description="Streams you watch will show up here." />
      </View>
    </ScreenContainer>
  );
}
