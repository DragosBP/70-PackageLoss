import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const USER_ID_KEY = 'beefapp_user_id';

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function getOrCreateUserId(): Promise<string> {
  const existingId = await getUserId();
  if (existingId) {
    return existingId;
  }

  const generatedId = String(uuid.v4());
  await AsyncStorage.setItem(USER_ID_KEY, generatedId);
  return generatedId;
}