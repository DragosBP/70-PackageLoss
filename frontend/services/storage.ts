import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_MAX_IMAGE_BYTES = 120 * 1024;

function isImageDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        reject(new Error('Unable to convert blob to base64'));
        return;
      }

      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
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

export async function getProfileImageBase64(
  imageUri: string,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
): Promise<string> {
  if (isImageDataUrl(imageUri)) {
    return imageUri;
  }

  const compressedUri = await compressToSize(imageUri, maxBytes);

  let base64Data: string;
  try {
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    base64Data = await blobToBase64(blob);
  } catch {
    base64Data = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  return `data:image/jpeg;base64,${base64Data}`;
}