import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const notificationResponseRef = useRef<Notifications.Subscription | null>(null);
  const notificationReceivedRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Handle notification received while app is in foreground
    notificationReceivedRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;

      if (data?.type === 'CHALLENGE_ASSIGNED') {
        // Show an in-app alert for foreground notifications
        Alert.alert(
          `New Challenge: ${data.challengeTitle || 'Challenge'}`,
          `Target: ${data.targetNickname || 'Unknown'}`,
          [
            { text: 'OK', style: 'default' },
          ]
        );
      }
    });

    // Handle notification tap (when user taps on notification)
    notificationResponseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data?.type === 'CHALLENGE_ASSIGNED') {
        // Navigate to challenge reveal screen
        router.push({
          pathname: '/challenge-reveal',
          params: {
            targetNickname: data.targetNickname as string,
            challengeTitle: data.challengeTitle as string,
            challengeDescription: data.challengeDescription as string,
          },
        });
      }
    });

    return () => {
      if (notificationReceivedRef.current) {
        notificationReceivedRef.current.remove();
      }
      if (notificationResponseRef.current) {
        notificationResponseRef.current.remove();
      }
    };
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="room-admin" options={{ headerShown: false }} />
        <Stack.Screen name="room-user" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ headerShown: false }} />
        <Stack.Screen
          name="challenge-reveal"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
