import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerForPushNotifications } from '@/services/notifications';
import { pickAndUploadImage } from '@/services/storage';

export const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';

type Step = 'welcome' | 'photo' | 'notifications';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Step: Welcome ─────────────────────────────────────────────────────────

  const handleWelcomeContinue = () => setStep('photo');

  // ── Step: Profile Photo ───────────────────────────────────────────────────

  const handlePickPhoto = async () => {
    try {
      setUploading(true);
      const result = await pickAndUploadImage();
      if (result) {
        setPhotoUri(result.downloadUrl);
        await AsyncStorage.setItem('@profile_photo_url', result.downloadUrl);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoNext = () => setStep('notifications');

  // ── Step: Notifications ───────────────────────────────────────────────────

  const handleEnableNotifications = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      await AsyncStorage.setItem('@push_token', token);
    } else {
      Alert.alert(
        'Notifications disabled',
        'You can enable notifications later in your device settings.',
      );
    }
    await finishOnboarding();
  };

  const handleSkipNotifications = () => finishOnboarding();

  // ── Finish ────────────────────────────────────────────────────────────────

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(tabs)');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            {`Let's get you set up in just a few steps.`}
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={handleWelcomeContinue}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (step === 'photo') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📷</Text>
          <Text style={styles.title}>Profile Photo</Text>
          <Text style={styles.subtitle}>
            Add a profile photo so others can recognise you.
          </Text>

          <Pressable style={styles.photoCircle} onPress={handlePickPhoto} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#0a7ea4" />
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoPlaceholder}>+</Text>
            )}
          </Pressable>

          {photoUri && (
            <Text style={styles.successText}>✓ Photo uploaded successfully</Text>
          )}
        </View>

        <Pressable style={styles.primaryButton} onPress={handlePhotoNext}>
          <Text style={styles.primaryButtonText}>
            {photoUri ? 'Continue' : 'Skip for now'}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // step === 'notifications'
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>Stay in the loop</Text>
        <Text style={styles.subtitle}>
          Enable notifications to get real-time updates.{'\n'}
          {Platform.OS === 'ios'
            ? 'You\'ll see a system prompt to confirm.'
            : 'You can change this in your settings at any time.'}
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={handleEnableNotifications}>
        <Text style={styles.primaryButtonText}>Enable Notifications</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={handleSkipNotifications}>
        <Text style={styles.secondaryButtonText}>Skip</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#687076',
    fontSize: 15,
  },
  photoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F4F8',
    borderWidth: 2,
    borderColor: '#0a7ea4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    fontSize: 40,
    color: '#0a7ea4',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    marginTop: 8,
  },
});
