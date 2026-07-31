import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppHeader, Card, EmptyState, ErrorView, ScreenContainer } from '@/components';
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
const SCREEN_PADDING = 24; // theme.spacing.md
const FEATURED_GAP = 16; // theme.spacing.sm
const GRID_GAP = 24; // theme.spacing.md
const GRID_SKELETON_KEYS = [0, 1, 2, 3];

export default function BrowseScreen() {
  const theme = useTheme();
  const { data: streams, isPending, isError, refetch } = useStreams();
  const featuredStreams = streams?.slice(0, 3) ?? [];

  return (
    <ScreenContainer scroll style={{ paddingBottom: theme.spacing.xxl }}>
      <View style={{ paddingHorizontal: SCREEN_PADDING, paddingTop: theme.spacing.sm }}>
        <AppHeader title="Live" subtitle="Discover what's happening right now" />
      </View>

      <View style={{ paddingHorizontal: SCREEN_PADDING }}>
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
                paddingHorizontal: theme.spacing.sm,
                // Card's own default padding (theme.spacing.sm, all sides)
                // was still winning on top/bottom here — combined with
                // this row's fixed 48 height, that left only ~16px of
                // vertical content space for a 24px-line-height placeholder,
                // clipping it. justifyContent: 'center' below already does
                // all the vertical centering; padding must not compete
                // with it for the same space.
                paddingVertical: 0,
                ...theme.shadows.sm,
              },
            ]}
          >
            <View style={styles.searchRow}>
              <Ionicons
                name="search"
                size={18}
                color={theme.colors.textMuted}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                Search streams, creators...
              </Text>
            </View>
          </Card>
        )}
      </View>

      {isPending ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <View style={{ paddingHorizontal: SCREEN_PADDING, marginBottom: theme.spacing.sm }}>
            <Skeleton width={160} height={26} radius={theme.radius.sm} />
          </View>
          <View
            style={{ flexDirection: 'row', paddingHorizontal: SCREEN_PADDING, gap: FEATURED_GAP }}
          >
            <Skeleton width={FEATURED_CARD_WIDTH} height={208} radius={theme.radius.xl} />
            <Skeleton width={FEATURED_CARD_WIDTH} height={208} radius={theme.radius.xl} />
          </View>

          <View style={{ marginTop: theme.spacing.xl, paddingHorizontal: SCREEN_PADDING }}>
            <Skeleton
              width={130}
              height={26}
              radius={theme.radius.sm}
              style={{ marginBottom: theme.spacing.sm }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
              {GRID_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} width="47%" height={220} radius={theme.radius.xl} />
              ))}
            </View>
          </View>
        </View>
      ) : isError ? (
        <View style={{ paddingHorizontal: SCREEN_PADDING, marginTop: theme.spacing.xl }}>
          <ErrorView
            title="Couldn't load streams"
            description="Something went wrong while loading live streams."
            actionLabel="Retry"
            onAction={() => void refetch()}
            icon="cloud-offline-outline"
          />
        </View>
      ) : streams.length === 0 ? (
        <View style={{ paddingHorizontal: SCREEN_PADDING, marginTop: theme.spacing.xl }}>
          <EmptyState
            title="No live streams right now"
            description="Check back soon, or start your own stream to be the first."
            icon="radio-outline"
          />
        </View>
      ) : (
        <>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={{ marginTop: theme.spacing.xl }}
          >
            <Text
              style={[
                theme.typography.heading1,
                {
                  color: theme.colors.textPrimary,
                  paddingHorizontal: SCREEN_PADDING,
                  marginBottom: theme.spacing.sm,
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
              contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, gap: FEATURED_GAP }}
            >
              {featuredStreams.map((stream, index) => (
                <StreamCard key={stream.id} stream={stream} index={index} featured />
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={{ marginTop: theme.spacing.xl, paddingHorizontal: SCREEN_PADDING }}
          >
            <Text
              style={[
                theme.typography.heading1,
                { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
              ]}
            >
              Live Now
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
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
});
