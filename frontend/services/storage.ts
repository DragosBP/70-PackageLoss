import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import uuid from 'react-native-uuid';

import firebaseApp from './firebase';

const storage = getStorage(firebaseApp);

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Opens the device image picker, compresses the selected image, uploads it to
 * Firebase Storage under `images/<filename>`, and returns the public download URL.
 *
 * @param storagePath  Optional custom path inside the bucket (default: `images/<timestamp>.jpg`)
 * @param quality      JPEG quality 0–1 (default: 0.7)
 */
export async function pickAndUploadImage(
  storagePath?: string,
  quality = 0.7,
): Promise<UploadResult | null> {
  // 1. Request media-library permission (iOS requires explicit grant)
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission not granted');
  }

  // 2. Launch the image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1, // We compress manually below for more control
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];

  // 3. Compress the image
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 800 } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
  );

  // 4. Convert local URI → Blob
  const response = await fetch(manipulated.uri);
  const blob = await response.blob();

  // 5. Upload to Firebase Storage
  const filename = storagePath ?? `images/${Date.now()}_${uuid.v4()}.jpg`;
  const storageRef = ref(storage, filename);
  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ downloadUrl, storagePath: filename });
      },
    );
  });
}
