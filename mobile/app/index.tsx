import { StyleSheet, Text, View } from 'react-native';

// Placeholder root route — routing infrastructure only, not a product screen.
// Replace with the real entry screen in the feature-building phase.
export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Project architecture ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
