import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Card, EmptyState, ErrorView, ScreenContainer } from '@/components';
import { useStreams } from '@/hooks';
import { useTheme } from '@/theme';

import { Skeleton } from './_components/Skeleton';
import { FEATURED_CARD_WIDTH, StreamCard } from './_components/StreamCard';

// Design-system + navigation skeleton from Step 5, now wired to real data.
// No stream creation, chat, presence, or viewer-screen logic here — that's
// separate, later steps.
//
// Presentation-only pass: layout, spacing, color, typography, skeleton
// loading and entrance animations below. Data loading (useStreams), the
// repository, and navigation behavior are untouched.
//
// The page title/subtitle are rendered locally here rather than via the
// shared AppHeader component — AppHeader is also used by the Creator
// screen, and this task is scoped to Browse only.
const FEATURED_GAP = 16;

export default function BrowseScreen() {
  const theme = useTheme();
  const { data: streams, isPending, isError, refetch } = useStreams();
  const featuredStreams = streams?.slice(0, 3) ?? [];

  return (
    <ScreenContainer scroll style={{ paddingBottom: theme.spacing.xxl }}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
        }}
      >
        <Text
          style={[
            theme.typography.display,
            { color: theme.colors.textPrimary, fontWeight: theme.fontWeight.bold },
          ]}
        >
          Live
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          ]}
        >
          {"Discover what's happening right now"}
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        {isPending ? (
          <Skeleton height={48} radius={theme.radius.full} />
        ) : (
          <Card
            style={[
              styles.searchBar,
              {
                borderRadius: theme.radius.full,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceElevated,
                paddingHorizontal: theme.spacing.lg,
                ...theme.shadows.sm,
              },
            ]}
          >
            <View style={styles.searchRow}>
              <Text style={[styles.searchIcon, { marginRight: theme.spacing.sm }]}>
                {'\u{1F50D}'}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                Search streams, creators...
              </Text>
            </View>
          </Card>
        )}
      </View>

      {isPending ? (
        <View style={{ marginTop: theme.spacing.xxl }}>
          <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
            <Skeleton width={160} height={26} radius={theme.radius.sm} />
          </View>
          <View
            style={{ flexDirection: 'row', paddingHorizontal: theme.spacing.lg, gap: FEATURED_GAP }}
          >
            <Skeleton
              width={FEATURED_CARD_WIDTH}
              height={(FEATURED_CARD_WIDTH * 9) / 16 + 64}
              radius={theme.radius.xl}
            />
            <Skeleton
              width={FEATURED_CARD_WIDTH}
              height={(FEATURED_CARD_WIDTH * 9) / 16 + 64}
              radius={theme.radius.xl}
            />
          </View>

          <View
            style={{
              marginTop: theme.spacing.xxl,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Skeleton
              width={130}
              height={26}
              radius={theme.radius.sm}
              style={{ marginBottom: theme.spacing.lg }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg }}>
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} width="47%" height={190} radius={theme.radius.lg} />
              ))}
            </View>
          </View>
        </View>
      ) : isError ? (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.xxl,
            alignItems: 'center',
          }}
        >
          <Text style={styles.stateIcon}>{'⚠️'}</Text>
          <ErrorView
            title="Couldn't load streams"
            description="Something went wrong while loading live streams."
            actionLabel="Retry"
            onAction={() => void refetch()}
          />
        </View>
      ) : streams.length === 0 ? (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.xxl,
            alignItems: 'center',
          }}
        >
          <Text style={styles.stateIcon}>{'\u{1F4E1}'}</Text>
          <EmptyState
            title="No live streams right now"
            description="Check back soon, or start your own stream to be the first."
          />
        </View>
      ) : (
        <>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ marginTop: theme.spacing.xxl }}
          >
            <Text
              style={[
                theme.typography.heading1,
                {
                  color: theme.colors.textPrimary,
                  paddingHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.lg,
                },
              ]}
            >
              Featured Live
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={FEATURED_CARD_WIDTH + FEATURED_GAP}
              snapToAlignment="start"
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: FEATURED_GAP }}
            >
              {featuredStreams.map((stream, index) => (
                <StreamCard key={stream.id} stream={stream} index={index} featured />
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={{ marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg }}
          >
            <Text
              style={[
                theme.typography.heading1,
                { color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
              ]}
            >
              Live Now
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg }}>
              {streams.map((stream, index) => (
                <StreamCard key={stream.id} stream={stream} index={index} />
              ))}
            </View>
          </Animated.View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchBar: { height: 48, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchIcon: { fontSize: 16 },
  stateIcon: { fontSize: 40, marginBottom: 12 },
});
