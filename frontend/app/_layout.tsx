import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="admin-qr"
          options={{ title: 'Generate QR Code' }}
        />
        <Stack.Screen
          name="scanner"
          options={{ title: 'Scan QR Code', headerShown: false }}
        />
        <Stack.Screen
          name="room-lobby"
          options={{ title: 'Room Lobby' }}
        />
        <Stack.Screen
          name="challenge-reveal"
          options={{
            title: 'Challenge Reveal',
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
