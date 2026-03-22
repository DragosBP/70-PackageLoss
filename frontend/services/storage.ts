import { FirebaseStorage, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { firebaseStorage, firebaseStorageFallback } from './firebase';

const DEFAULT_MAX_IMAGE_BYTES = 300 * 1024;

async function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = () => {
      reject(new Error('Failed to convert file URI to Blob'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

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

    const fileInfo = await FileSystem.getInfoAsync(manipulated.uri);

    lastResultUri = manipulated.uri;
    if (fileInfo.exists && typeof fileInfo.size === 'number' && fileInfo.size <= maxBytes) {
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

export async function getProfileImageBase64(
  imageUri: string,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
): Promise<string> {
  const compressedUri = await compressToSize(imageUri, maxBytes);
  const base64Data = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64Data}`;
}

export async function uploadProfileImage(
  roomId: string,
  userId: string,
  imageUri: string,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
): Promise<string> {
  let blob: Blob | null = null;

  const uploadToStorage = async (storage: FirebaseStorage): Promise<string> => {
    if (!blob) {
      throw new Error('Missing blob payload for upload');
    }

    const imageRef = ref(storage, `rooms/${roomId}/${userId}.jpg`);
    await uploadBytes(imageRef, blob, {
      contentType: 'image/jpeg',
    });
    return getDownloadURL(imageRef);
  };

  try {
    const compressedUri = await compressToSize(imageUri, maxBytes);
    blob = await uriToBlob(compressedUri);

    try {
      return await uploadToStorage(firebaseStorage);
    } catch (primaryError: unknown) {
      const primaryCode =
        primaryError &&
        typeof primaryError === 'object' &&
        'code' in primaryError &&
        typeof primaryError.code === 'string'
          ? primaryError.code
          : null;

      if (primaryCode === 'storage/unknown') {
        return uploadToStorage(firebaseStorageFallback);
      }

      throw primaryError;
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object') {
      const possibleCode =
        'code' in error && typeof error.code === 'string' ? error.code : null;
      const possibleMessage =
        'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Firebase Storage upload failed';
      const serverResponse =
        'serverResponse' in error && typeof error.serverResponse === 'string'
          ? error.serverResponse
          : 'customData' in error &&
              error.customData &&
              typeof error.customData === 'object' &&
              'serverResponse' in error.customData &&
              typeof error.customData.serverResponse === 'string'
            ? error.customData.serverResponse
            : null;

      const details = [possibleMessage, possibleCode, serverResponse]
        .filter(Boolean)
        .join(' | ');

      throw new Error(details || 'Firebase Storage upload failed');
    }

    throw error;
  } finally {
    if (blob && 'close' in blob && typeof blob.close === 'function') {
      blob.close();
    }
  }
}