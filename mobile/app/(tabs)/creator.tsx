import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Avatar, LiveBadge, PrimaryButton, ScreenContainer, ViewerCountBadge } from '@/components';
import { useTheme } from '@/theme';

const MOCK_CHAT = [
  { id: '1', name: 'Jules', message: 'this is awesome!! 🔥' },
  { id: '2', name: 'Ren', message: 'wya from?' },
  { id: '3', name: 'Priya', message: "let's goo" },
];

// Placeholder: design-system + navigation skeleton only. Starting/ending a
// stream and real chat land in later steps — End Stream is a no-op stub.
export default function CreatorScreen() {
  const theme = useTheme();

  return (
    <ScreenContainer edges={['top', 'bottom']} style={{ padding: theme.spacing.lg }}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.video, { borderRadius: theme.radius.lg }]}
      >
        <LinearGradient
          colors={['#341F97', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: theme.radius.lg }]}
        />
        <View style={[styles.overlayRow, { padding: theme.spacing.md }]}>
          <LiveBadge />
          <ViewerCountBadge count={842} />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(400).delay(100)}
        style={[
          styles.chatPanel,
          {
            backgroundColor: theme.colors.overlay,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginTop: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
          ]}
        >
          CHAT
        </Text>
        {MOCK_CHAT.map((entry) => (
          <View key={entry.id} style={[styles.chatRow, { marginBottom: theme.spacing.sm }]}>
            <Avatar name={entry.name} size={24} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textPrimary, marginLeft: theme.spacing.xs, flex: 1 },
              ]}
            >
              <Text style={theme.typography.label}>{entry.name} </Text>
              {entry.message}
            </Text>
          </View>
        ))}
      </Animated.View>

      <View style={{ marginTop: theme.spacing.lg }}>
        {/* TODO: wire to streamRepository.end() once stream state exists */}
        <PrimaryButton label="End Stream" variant="danger" onPress={() => {}} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  video: { aspectRatio: 16 / 9, overflow: 'hidden' },
  overlayRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chatPanel: { flex: 1 },
  chatRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
