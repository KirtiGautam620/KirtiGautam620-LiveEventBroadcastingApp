import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppHeader, Card, EmptyState, ScreenContainer } from '@/components';
import { useTheme } from '@/theme';

import { MOCK_STREAMS } from './_components/mockStreams';
import { StreamCard } from './_components/StreamCard';

const FEATURED_STREAMS = MOCK_STREAMS.slice(0, 3);

// Placeholder: design-system + navigation skeleton only. Stream data is
// static UI fixture data (see _components/mockStreams.ts) — real listing
// via streamRepository.listLive() lands in a later step.
export default function BrowseScreen() {
  const theme = useTheme();

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
          {FEATURED_STREAMS.map((stream, index) => (
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
          {MOCK_STREAMS.map((stream, index) => (
            <StreamCard key={stream.id} stream={stream} index={index} />
          ))}
        </View>
      </Animated.View>

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
