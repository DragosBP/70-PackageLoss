import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { Alert } from 'react-native';
import { Platform } from 'react-native';

const TOKEN_KEY = 'beefapp_push_token';
const FCM_TOKEN_KEY = 'beefapp_fcm_token';
const IS_EXPO_GO =
  isRunningInExpoGo() ||
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

export interface LocalChallengeNotificationData {
  challengeTitle?: string;
  challengeDescription?: string;
  targetNickname?: string;
}

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (IS_EXPO_GO) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((mod) => mod)
      .catch((error) => {
        console.warn('expo-notifications unavailable in this environment:', error);
        return null;
      });
  }

  return notificationsModulePromise;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A9DFF',
    });
  } catch (error) {
    // Expo Go can reject Android push channel setup for remote push features.
    console.warn('Android notification channel setup skipped:', error);
  }
}

export async function registerForPushTokenAsync(): Promise<string> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error('Push notifications are not available in Expo Go. Use a development build.');
  }

  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }

  try {
    await ensureAndroidChannel(Notifications);

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
  } catch (error) {
    throw new Error(`Failed to register for push token: ${String(error)}`);
  }
}

/**
 * Get the native device push token (FCM token on Android, APNs token on iOS)
 * This is the token needed for Firebase Cloud Messaging
 */
export async function getNativePushToken(): Promise<string | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn('Native push token unavailable in Expo Go. Use a development build for remote notifications.');
    return null;
  }

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
    await ensureAndroidChannel(Notifications);

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
    try {
      const tokenResult = await Notifications.getDevicePushTokenAsync();
      const token = tokenResult.data;

      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    } catch (nativeTokenError) {
      console.warn('Native push token unavailable, falling back to Expo push token:', nativeTokenError);

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        undefined;

      const expoTokenResult = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      await AsyncStorage.setItem(TOKEN_KEY, expoTokenResult.data);
      return expoTokenResult.data;
    }
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

export async function scheduleLocalChallengeAssignedNotification(
  data: LocalChallengeNotificationData,
): Promise<void> {
  if (!IS_EXPO_GO || Platform.OS === 'web') {
    return;
  }

  const title = `New Challenge: ${data.challengeTitle || 'Challenge'}`;
  const message = data.targetNickname
    ? `Target: ${data.targetNickname}`
    : data.challengeDescription || 'Open the app to see your mission.';

  // Expo Go on Android SDK 53+ cannot use expo-notifications remote flow.
  // Fallback to an in-app alert when assignment changes.
  Alert.alert(title, message, [{ text: 'View challenge', style: 'default' }]);
}