import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { firebaseStorage } from './firebase';

const DEFAULT_MAX_IMAGE_BYTES = 300 * 1024;

async function compressToSize(uri: string, maxBytes: number): Promise<string> {
  let currentUri = uri;
  let quality = 0.8;
  let lastResultUri = uri;

  for (let i = 0; i < 6; i += 1) {
    const manipulated = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: 1024 } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    // Check blob size instead of file system (works on web and native)
    const response = await fetch(manipulated.uri);
    const blob = await response.blob();

    lastResultUri = manipulated.uri;
    if (blob.size <= maxBytes) {
      return manipulated.uri;
    }

    currentUri = manipulated.uri;
    quality = Math.max(0.2, quality - 0.12);
  }

  return lastResultUri;
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissions.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadProfileImage(
  roomId: string,
  userId: string,
  imageUri: string,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
): Promise<string> {
  const compressedUri = await compressToSize(imageUri, maxBytes);

  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const imageRef = ref(firebaseStorage, `rooms/${roomId}/${userId}.jpg`);
  await uploadBytes(imageRef, blob, {
    contentType: 'image/jpeg',
  });

  return getDownloadURL(imageRef);
}