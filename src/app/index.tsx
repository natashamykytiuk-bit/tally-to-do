import { signOut } from 'firebase/auth';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/providers/auth';

// Placeholder until step 4 (sidebar, list view, TaskRow).
export default function Home() {
  const { user } = useAuth();
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.center}>
        <ThemedText type="title">Tally</ThemedText>
        <ThemedText>Signed in as {user?.email}</ThemedText>
        <Pressable onPress={() => auth && signOut(auth)}>
          <ThemedText type="link">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
