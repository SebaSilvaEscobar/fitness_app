import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const signedIn = !!session;
  const onboarded = !!profile?.onboarded;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" options={{ title: 'Tu perfil' }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routine/[id]" options={{ title: 'Rutina' }} />
          <Stack.Screen name="workout/[dayId]" options={{ title: 'Entrenando', gestureEnabled: false }} />
          <Stack.Screen name="meal-plan/[id]" options={{ title: 'Plan nutricional' }} />
          <Stack.Screen name="log-food" options={{ title: 'Registrar comida', presentation: 'modal' }} />
          <Stack.Screen name="edit-profile" options={{ title: 'Editar perfil' }} />
          <Stack.Screen name="trainer/index" options={{ title: 'Modo entrenador' }} />
          <Stack.Screen name="trainer/client/[id]" options={{ title: 'Cliente' }} />
          <Stack.Screen name="trainer/routine-editor" options={{ title: 'Editor de rutina' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
