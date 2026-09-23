import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/providers/auth';

export default function SignIn() {
  const { user } = useAuth();
  const theme = useTheme();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const a = auth;
  if (user) return <Redirect href="/" />;
  if (!firebaseConfigured || !a) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.form}>
          <ThemedText type="subtitle">Firebase isn’t set up yet</ThemedText>
          <ThemedText>
            Copy .env.example to .env.local, fill in your Firebase web app keys, then restart Expo.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const fn = mode === 'in' ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      await fn(a, email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^Firebase: /, '') : String(e));
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.form}>
        <ThemedText type="title" role="heading" aria-level={1}>
          Tally
        </ThemedText>
        <TextInput
          accessibilityLabel="Email"
          style={input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          accessibilityLabel="Password"
          style={input}
          placeholder="Password"
          secureTextEntry
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          value={password}
          onChangeText={setPassword}
        />
        {!!error && (
          <ThemedText style={styles.error} role="alert">
            {error}
          </ThemedText>
        )}
        <Pressable
          accessibilityRole="button"
          style={[styles.btn, busy && { opacity: 0.6 }]}
          disabled={busy}
          onPress={submit}>
          <ThemedText style={styles.btnText}>{mode === 'in' ? 'Sign in' : 'Create account'}</ThemedText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setMode(mode === 'in' ? 'up' : 'in')}>
          <ThemedText type="link">
            {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </ThemedText>
        </Pressable>
        {/* TODO: Google sign-in (needs OAuth client IDs; expo-auth-session + signInWithCredential). */}
      </SafeAreaView>
      <SafeAreaView edges={['bottom']}>
        <Copyright />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  form: { flex: 1, justifyContent: 'center', gap: 12, padding: 24, maxWidth: 420, width: '100%', alignSelf: 'center' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  btn: { backgroundColor: '#3354C4', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#B4492F' },
});
