import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Requests push-notification permissions and returns the Expo / FCM device
 * token.  On Android a notification channel must be created before requesting
 * the token.
 *
 * Returns `null` when:
 *  - the user denies the permission, or
 *  - the app is running in an environment without push support (e.g. iOS
 *    simulator without a physical device token).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Android requires an explicit notification channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0a7ea4',
    });
  }

  // Check / request permission.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Retrieve the push token (Expo token that maps to an FCM / APNs token).
  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Configures how incoming notifications are handled while the app is in the
 * foreground.  Call this once at app startup.
 */
export function configureForegroundNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
