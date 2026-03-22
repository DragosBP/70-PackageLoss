import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = '@device_id';

/**
 * Returns the persisted device UUID, creating and storing one on first call.
 */
export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const newId = uuid.v4() as string;
  await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}
