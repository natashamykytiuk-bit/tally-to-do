import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useIsDark } from '@/constants/tally';
import { AuthProvider, useAuth } from '@/providers/auth';
import { PrefsProvider } from '@/providers/prefs';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { loading } = useAuth();
  const isDark = useIsDark();
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);
  if (loading) return null;
  // Each screen redirects itself based on auth state (see index.tsx and sign-in.tsx).
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Web tab title. Rendered here, not in RootStack, so it's present before auth loads (and in the static HTML). */}
      <Head>
        <title>Tally</title>
      </Head>
      <AuthProvider>
        <PrefsProvider>
          <RootStack />
        </PrefsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
