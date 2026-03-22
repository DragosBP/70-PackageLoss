import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getOrCreateUserId } from '@/services/identity';
import { registerForPushTokenAsync } from '@/services/notifications';
import { saveLocalProfile } from '@/services/profile';
import { pickImageFromLibrary, uploadProfileImage } from '@/services/storage';

const MAX_PROFILE_IMAGE_BYTES = 300 * 1024;

export default function OnboardingScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onPickImage = async () => {
    const uri = await pickImageFromLibrary();
    if (!uri) {
      Alert.alert('Image required', 'Please allow media access and pick a profile photo.');
      return;
    }

    setImageUri(uri);
  };

  const onContinue = async () => {
    const normalizedNickname = nickname.trim();
    if (!normalizedNickname) {
      Alert.alert('Nickname required', 'Please enter your nickname.');
      return;
    }

    if (!imageUri) {
      Alert.alert('Profile image required', 'Please pick an image before continuing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await getOrCreateUserId();
      const pfpUrl = await uploadProfileImage(userId, imageUri, MAX_PROFILE_IMAGE_BYTES);

      let fcmToken = '';
      try {
        fcmToken = await registerForPushTokenAsync();
      } catch {
        Alert.alert(
          'Notifications unavailable',
          'Profile created, but push token could not be retrieved on this device.',
        );
      }

      await saveLocalProfile({
        user_id: userId,
        nickname: normalizedNickname,
        pfp_url: pfpUrl,
        fcm_token: fcmToken,
      });

      router.replace('/(tabs)');
    } catch {
      Alert.alert('Onboarding failed', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Set up your party profile</Text>
        <Text style={styles.subtitle}>Nickname, photo, and push permissions are needed once.</Text>

        <Pressable style={styles.imagePicker} onPress={() => void onPickImage()}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
          ) : (
            <Text style={styles.imagePlaceholder}>Tap to pick a profile photo</Text>
          )}
        </Pressable>

        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="Nickname"
          autoCapitalize="none"
          maxLength={64}
        />

        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
          onPress={() => void onContinue()}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonLabel}>Continue</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 8,
  },
  imagePicker: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    color: '#475569',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});