import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDeviceId } from '@/services/identity';
import { configureForegroundNotifications } from '@/services/notifications';
import { ONBOARDING_COMPLETE_KEY } from './onboarding';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Configure how foreground notifications are displayed.
    configureForegroundNotifications();

    // Ensure a stable device identity exists.
    getDeviceId().catch(console.error);

    // Redirect first-time users to the onboarding flow.
    AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
      .then((value) => {
        if (!value) {
          router.replace('/onboarding');
        }
      })
      .catch(console.error)
      .finally(() => setIsReady(true));
  }, [router]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
