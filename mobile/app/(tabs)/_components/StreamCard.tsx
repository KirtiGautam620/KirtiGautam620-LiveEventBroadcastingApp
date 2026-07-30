import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

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

function gradientForIndex(index: number): [string, string] {
  return THUMBNAIL_GRADIENTS[index % THUMBNAIL_GRADIENTS.length] ?? DEFAULT_GRADIENT;
}

interface StreamCardProps {
  stream: StreamWithCreator;
  index: number;
  featured?: boolean;
}

export function StreamCard({ stream, index, featured = false }: StreamCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const creatorName = stream.creator?.display_name ?? stream.creator?.username ?? 'Streamer';

  return (
    <Card
      onPress={() => router.push(`/viewer/${stream.id}`)}
      style={featured ? styles.featuredCard : styles.gridCard}
    >
      <View style={[styles.thumbnail, { borderRadius: theme.radius.md }]}>
        <LinearGradient
          colors={gradientForIndex(index)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: theme.radius.md }]}
        />
        <View style={[styles.thumbnailOverlay, { padding: theme.spacing.xs }]}>
          <LiveBadge />
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Text
          numberOfLines={2}
          style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}
        >
          {stream.title}
        </Text>
        <View style={[styles.meta, { marginTop: theme.spacing.xs }]}>
          <Avatar name={creatorName} uri={stream.creator?.avatar_url ?? undefined} size={24} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
            >
              {creatorName}
            </Text>
            {stream.description ? (
              <Text
                numberOfLines={1}
                style={[theme.typography.label, { color: theme.colors.textMuted }]}
              >
                {stream.description}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gridCard: { width: '47%' },
  featuredCard: { width: 220 },
  thumbnail: { aspectRatio: 16 / 9, overflow: 'hidden' },
  thumbnailOverlay: { flex: 1, alignItems: 'flex-start' },
  meta: { flexDirection: 'row', alignItems: 'center' },
});
