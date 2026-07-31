import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, Card, LiveBadge } from '@/components';
import { thumbnailGradient, useTheme } from '@/theme';
import type { StreamWithCreator } from '@/types/database';

// ~82% of the screen width leaves a deliberate peek of the next card in the
// horizontal Featured Live carousel — a hero card, not a compact tile.
export const FEATURED_CARD_WIDTH = Math.min(
  340,
  Math.max(300, Math.round(Dimensions.get('window').width * 0.82)),
);
const FEATURED_CARD_HEIGHT = 208;
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
//
// Featured is a full-bleed hero tile (title/creator overlaid on the
// artwork over a bottom scrim, Instagram/YouTube-hero style). The grid
// variant is deliberately built the opposite way — thumbnail on top,
// content in normal flow below it, not overlaid — so the two sections
// read as structurally different, not just differently sized.
export function StreamCard({ stream, index, featured = false }: StreamCardProps) {
  const theme = useTheme();
  const router = useRouter();
  // display_name only — never fall back to username (it's UUID-derived,
  // e.g. "user_3f8a9b2c", exactly the anonymous-looking id this card is
  // meant to avoid showing).
  const creatorName = stream.creator?.display_name?.trim() || 'Creator';
  const category = stream.category || 'General';
  // One coherent announcement instead of the title/avatar-initial/creator
  // name/category all reading as separate fragments.
  const cardLabel = `${stream.title}, live now, by ${creatorName}, ${category}`;

  const card = featured ? (
    <Card
      onPress={() => router.push(`/viewer/${stream.id}`)}
      accessibilityLabel={cardLabel}
      style={{
        width: FEATURED_CARD_WIDTH,
        height: FEATURED_CARD_HEIGHT,
        padding: 0,
        overflow: 'hidden',
        ...theme.shadows.xl,
      }}
    >
      <LinearGradient
        colors={thumbnailGradient(index)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={theme.gradients.scrimBottom}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroScrim}
      />

      <View style={[styles.heroTopRow, { padding: theme.spacing.sm }]}>
        <LiveBadge />
        <View
          style={[
            styles.categoryChip,
            {
              backgroundColor: theme.colors.overlayStrong,
              borderRadius: theme.radius.full,
              // Matches LiveBadge's padding scale exactly — the two badges
              // share this row, so they should share a padding rhythm.
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            },
          ]}
        >
          <Text numberOfLines={1} style={[theme.typography.label, styles.categoryChipText]}>
            {category}
          </Text>
        </View>
      </View>

      <View style={[styles.heroBottomContent, { padding: theme.spacing.sm }]}>
        <Text
          numberOfLines={2}
          style={[theme.typography.heading2, styles.heroTitle, { color: theme.colors.textPrimary }]}
        >
          {stream.title}
        </Text>
        <View style={[styles.meta, { marginTop: theme.spacing.xs }]}>
          <Avatar name={creatorName} uri={stream.creator?.avatar_url ?? undefined} size={32} />
          <Text
            numberOfLines={1}
            style={[
              theme.typography.username,
              styles.heroCreatorName,
              { marginLeft: theme.spacing.xs },
            ]}
          >
            {creatorName}
          </Text>
        </View>
      </View>
    </Card>
  ) : (
    <Card
      onPress={() => router.push(`/viewer/${stream.id}`)}
      accessibilityLabel={cardLabel}
      style={[
        styles.gridCard,
        // Card's default border (theme.colors.border, ~6% white) and
        // shadow.md read as almost nothing against this dark background —
        // a visibly stronger border + deeper shadow gives these cards
        // actual definition instead of blending flat into the screen.
        {
          borderColor: theme.colors.glassBorder,
          borderWidth: 1,
          ...theme.shadows.lg,
        },
      ]}
    >
      <View style={[styles.thumbnail, { borderRadius: theme.radius.lg }]}>
        <LinearGradient
          colors={thumbnailGradient(index)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* The featured hero card scrims its LIVE badge corner; the grid
            thumbnail never did, so the badge's legibility depended on
            luck of which random gradient landed there. Same treatment,
            smaller footprint. */}
        <LinearGradient colors={theme.gradients.scrimTop} style={styles.gridScrim} />
        <View style={[styles.thumbnailOverlay, { padding: theme.spacing.xs }]}>
          <LiveBadge />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Text
          numberOfLines={2}
          style={[
            theme.typography.bodyStrong,
            styles.gridTitle,
            { color: theme.colors.textPrimary },
          ]}
        >
          {stream.title}
        </Text>
        {/* flex-start, not center: with two stacked lines of metadata next
            to it, centering made the avatar float between them rather than
            sit with the creator name it's paired with. */}
        <View style={[styles.meta, styles.gridMeta, { marginTop: theme.spacing.xs }]}>
          <Avatar name={creatorName} uri={stream.creator?.avatar_url ?? undefined} size={24} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[theme.typography.username, { color: theme.colors.textSecondary }]}
            >
              {creatorName}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                theme.typography.label,
                styles.gridCategory,
                { color: theme.colors.textMuted },
              ]}
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
  thumbnail: { aspectRatio: 16 / 9, overflow: 'hidden' },
  thumbnailOverlay: { flex: 1, alignItems: 'flex-start' },
  gridScrim: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
  gridTitle: { fontWeight: '700' },
  gridMeta: { alignItems: 'flex-start' },
  gridCategory: { marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '35%' },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  categoryChip: { maxWidth: '55%' },
  categoryChipText: { color: '#FFFFFF' },
  heroBottomContent: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  heroTitle: { fontWeight: '700' },
  heroCreatorName: { color: 'rgba(255, 255, 255, 0.94)' },
});
