import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ViewerCountBadge } from '@/components';
import { useTheme } from '@/theme';

const MOCK_CHAT = [
  { id: '1', name: 'Amara', message: 'this is so good 👏' },
  { id: '2', name: 'Leo', message: 'first time catching you live!' },
  { id: '3', name: 'Sana', message: '🔥🔥🔥' },
  { id: '4', name: 'Devon', message: 'where are you streaming from?' },
];

// Placeholder: design-system + navigation skeleton only. Video playback and
// real chat land in later steps — messages and the input bar are static.
export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

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
          <ViewerCountBadge count={1204} />
        </View>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.lg },
          ]}
        >
          Stream {id}
        </Text>

        <View style={styles.spacer} />

        <Animated.View
          entering={FadeIn.duration(400)}
          style={{ paddingHorizontal: theme.spacing.md }}
        >
          {MOCK_CHAT.map((entry) => (
            <View key={entry.id} style={[styles.chatRow, { marginBottom: theme.spacing.sm }]}>
              <Avatar name={entry.name} size={22} />
              <View
                style={[
                  styles.chatBubble,
                  {
                    backgroundColor: theme.colors.overlay,
                    borderRadius: theme.radius.md,
                    marginLeft: theme.spacing.xs,
                    padding: theme.spacing.sm,
                  },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.textPrimary }]}>
                  <Text style={theme.typography.label}>{entry.name} </Text>
                  {entry.message}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(400).delay(100)}
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.overlay,
              borderRadius: theme.radius.full,
              marginHorizontal: theme.spacing.md,
              marginTop: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        >
          <Text style={[theme.typography.body, { color: theme.colors.textMuted, flex: 1 }]}>
            Say something...
          </Text>
          <View
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.accent, borderRadius: theme.radius.full },
            ]}
          >
            <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>
              ➤
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1 },
  chatRow: { flexDirection: 'row', alignItems: 'flex-start' },
  chatBubble: { flex: 1 },
  inputBar: { flexDirection: 'row', alignItems: 'center' },
  sendButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
