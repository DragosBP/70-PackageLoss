import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'beefapp_profile';

export interface LocalProfile {
  user_id: string;
  nickname: string;
  pfp_base64: string;
  fcm_token: string;
}

export async function getLocalProfile(): Promise<LocalProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export async function saveLocalProfile(profile: LocalProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearLocalProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}