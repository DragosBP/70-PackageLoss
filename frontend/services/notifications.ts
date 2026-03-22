import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const TOKEN_KEY = 'beefapp_push_token';
const FCM_TOKEN_KEY = 'beefapp_fcm_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4A9DFF',
  });
}

export async function registerForPushTokenAsync(): Promise<string> {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }

  await ensureAndroidChannel();

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission not granted.');
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  const tokenResult = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  await AsyncStorage.setItem(TOKEN_KEY, tokenResult.data);
  return tokenResult.data;
}

/**
 * Get the native device push token (FCM token on Android, APNs token on iOS)
 * This is the token needed for Firebase Cloud Messaging
 */
export async function getNativePushToken(): Promise<string | null> {
  // Web doesn't support native push tokens
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  try {
    await ensureAndroidChannel();

    const existingPermissions = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermissions.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted.');
      return null;
    }

    // Get the native device token (FCM on Android, APNs on iOS)
    const tokenResult = await Notifications.getDevicePushTokenAsync();
    const token = tokenResult.data;

    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.error('Error getting native push token:', error);
    return null;
  }
}

export async function getSavedPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getSavedFCMToken(): Promise<string | null> {
  return AsyncStorage.getItem(FCM_TOKEN_KEY);
}