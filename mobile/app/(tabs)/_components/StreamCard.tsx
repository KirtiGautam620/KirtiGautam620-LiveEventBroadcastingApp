import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, Card, LiveBadge } from '@/components';
import { useTheme } from '@/theme';
import type { StreamWithCreator } from '@/types/database';

const THUMBNAIL_GRADIENTS: [string, string][] = [
  ['#6C5CE7', '#341F97'],
  ['#FF6B6B', '#C0392B'],
  ['#00B894', '#00695C'],
  ['#0984E3', '#1B3B6F'],
  ['#FD79A8', '#8E2A5B'],
  ['#FDCB6E', '#B8860B'],
];
const DEFAULT_GRADIENT: [string, string] = ['#6C5CE7', '#341F97'];
// Darkens the bottom edge of every thumbnail slightly so the floating LIVE
// badge stays legible regardless of which base gradient it sits on.
const VIGNETTE_GRADIENT: [string, string] = ['transparent', 'rgba(0, 0, 0, 0.45)'];

function gradientForIndex(index: number): [string, string] {
  return THUMBNAIL_GRADIENTS[index % THUMBNAIL_GRADIENTS.length] ?? DEFAULT_GRADIENT;
}

// ~72% of the screen width leaves a deliberate peek of the next card in the
// horizontal Featured Live carousel.
export const FEATURED_CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.72);
const FEATURED_ENTRANCE_STAGGER_MS = 80;

interface StreamCardProps {
  stream: StreamWithCreator;
  index: number;
  featured?: boolean;
}

// Deliberately does not show a live viewer count: that requires joining
// the stream's presence channel (usePresence), and this card renders on
// the Browse screen for every visible live stream — merely browsing must
// never track the viewer as present on a stream they haven't opened.
// Presence is only ever joined by the Creator screen (while live) and the
// Viewer screen (while actually watching that stream) — see
// services/presence.ts.

export function StreamCard({ stream, index, featured = false }: StreamCardProps) {
  const theme = useTheme();
  const router = useRouter();
  // display_name only — never fall back to username (it's UUID-derived,
  // e.g. "user_3f8a9b2c", exactly the anonymous-looking id this card is
  // meant to avoid showing).
  const creatorName = stream.creator?.display_name?.trim() || 'Creator';
  const category = stream.category || 'General';
  const cardRadius = featured ? theme.radius.xl : theme.radius.lg;

  const card = (
    <Card
      onPress={() => router.push(`/viewer/${stream.id}`)}
      style={[
        featured ? styles.featuredCard : styles.gridCard,
        {
          borderRadius: cardRadius,
          ...(featured ? theme.shadows.lg : theme.shadows.md),
        },
      ]}
    >
      <View style={[styles.thumbnail, { borderRadius: cardRadius }]}>
        <LinearGradient
          colors={gradientForIndex(index)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={VIGNETTE_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.thumbnailOverlay, { padding: theme.spacing.sm }]}>
          <LiveBadge />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Text
          numberOfLines={2}
          style={[
            featured ? theme.typography.heading2 : theme.typography.bodyStrong,
            { color: theme.colors.textPrimary, fontWeight: theme.fontWeight.bold },
          ]}
        >
          {stream.title}
        </Text>
        <View style={[styles.meta, { marginTop: theme.spacing.sm }]}>
          <Avatar
            name={creatorName}
            uri={stream.creator?.avatar_url ?? undefined}
            size={featured ? 32 : 24}
          />
          <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
              ]}
            >
              {`by ${creatorName}`}
            </Text>
            <Text
              numberOfLines={1}
              style={[theme.typography.label, { color: theme.colors.textMuted }]}
            >
              {category}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  if (!featured) {
    return card;
  }

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * FEATURED_ENTRANCE_STAGGER_MS)}>
      {card}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gridCard: { width: '47%' },
  featuredCard: { width: FEATURED_CARD_WIDTH },
  thumbnail: { aspectRatio: 16 / 9, overflow: 'hidden' },
  thumbnailOverlay: { flex: 1, alignItems: 'flex-start' },
  meta: { flexDirection: 'row', alignItems: 'center' },
});
