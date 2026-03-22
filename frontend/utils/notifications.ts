import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * Hook to handle FCM push notifications
 * Dev 3 should handle Firebase Cloud Messaging setup
 * This hook helps Dev 4 navigate to the challenge reveal screen
 */
export const useFCMNotifications = () => {
  const navigation = useNavigation();
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    // TODO: Dev 3 should implement Firebase Cloud Messaging here
    // This is a placeholder for the integration

    // Example implementation when Dev 3 provides messaging:
    /*
    import messaging from '@react-native-firebase/messaging';

    // Handle notification when app is in foreground
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Notification received:', remoteMessage);

      // Extract challenge data from notification payload
      const { targetNickname, challengeText } = remoteMessage.data;

      // Navigate to challenge reveal screen
      navigation.navigate('ChallengeRevealModal', {
        targetNickname,
        challengeText,
      });
    });

    // Handle notification when app is in background and opened
    messaging().onNotificationOpenedApp((remoteMessage) => {
      if (remoteMessage) {
        const { targetNickname, challengeText } = remoteMessage.data;
        navigation.navigate('ChallengeRevealModal', {
          targetNickname,
          challengeText,
        });
      }
    });

    return () => unsubscribe();
    */
  }, [navigation]);
};

/**
 * Deep linking handler for QR code content
 * Allows direct navigation from scanned QR code
 */
export const useLinking = () => {
  const linking = {
    prefixes: ['partyapp://', 'https://partyapp.com'],
    config: {
      screens: {
        'room-lobby': 'room/:roomId',
        'admin-qr': 'admin/qr/:roomId',
        'scanner': 'scan',
        'challenge-reveal': 'challenge/:challengeId',
      },
    },
  };

  return linking;
};

/**
 * Utility to navigate to a specific room
 * Can be called from FCM notifications or deep links
 */
export const navigateToRoom = (navigation: any, roomId: string) => {
  navigation.navigate('room-lobby', { roomId });
};

/**
 * Utility to show challenge reveal
 * Can be called from FCM notifications
 */
export const showChallenge = (
  navigation: any,
  targetNickname: string,
  challengeText: string
) => {
  navigation.navigate('challenge-reveal', {
    targetNickname,
    challengeText,
  });
};
