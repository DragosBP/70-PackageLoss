import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { roomAPI, handleApiError } from '../utils/api';
import { getOrCreateUserId } from '../services/identity';
import { getNativePushToken } from '../services/notifications';
import { getProfileImageBase64, uploadProfileImage } from '../services/storage';

const COLOR_RED = '#E63946';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_DIM = '#666666';

export default function UserScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ nickname?: string; mugshot?: string }>();

  const joinRoom = async (roomId: string, userNickname: string) => {
    setLoading(true);
    try {
      const userId = await getOrCreateUserId();
      const fcmToken = await getNativePushToken();

      // Upload image to Firebase Storage if present
      let pfp_url = '';
      let pfp_base64 = '';
      if (params.mugshot) {
        try {
          pfp_url = await uploadProfileImage(roomId, userId, params.mugshot);
        } catch (uploadError) {
          console.error('Failed to upload profile image:', uploadError);
          try {
            pfp_base64 = await getProfileImageBase64(params.mugshot);
          } catch (base64Error) {
            console.error('Failed to generate base64 profile image fallback:', base64Error);
          }
        }
      }

      await roomAPI.joinRoom(roomId, {
        user_id: userId,
        nickname: userNickname,
        pfp_url: pfp_url,
        pfp_base64,
        fcm_token: fcmToken || '',
      });

      router.replace({
        pathname: '/room-user',
        params: {
          roomId: roomId,
          nickname: userNickname,
          userId: userId,
          mugshot: pfp_url || pfp_base64 || params.mugshot || '',
        },
      });
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
      setScanned(false);
      setShowNicknameInput(false);
      setPendingRoomId(null);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLOR_RED} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need camera permissions to scan the QR code.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);

    // Validate that it's a 6-digit room ID
    if (!/^\d{6}$/.test(data)) {
      Alert.alert('Invalid QR Code', 'This QR code does not contain a valid room ID.');
      setScanned(false);
      return;
    }

    // If we have a nickname from params, join directly
    if (params.nickname) {
      await joinRoom(data, params.nickname);
    } else {
      // Need to collect nickname first
      setPendingRoomId(data);
      setShowNicknameInput(true);
    }
  };

  const handleJoinWithNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }
    if (!pendingRoomId) return;
    await joinRoom(pendingRoomId, nickname.trim());
  };

  if (showNicknameInput) {
    return (
      <View style={styles.container}>
        <View style={styles.nicknameCard}>
          <Text style={styles.nicknameTitle}>Almost there!</Text>
          <Text style={styles.nicknameSubtitle}>Enter your nickname to join the party</Text>

          <TextInput
            style={styles.nicknameInput}
            placeholder="Your nickname"
            placeholderTextColor={COLOR_DIM}
            value={nickname}
            onChangeText={setNickname}
            maxLength={64}
            autoFocus
            editable={!loading}
          />

          <Pressable
            style={[styles.joinButton, loading && styles.joinButtonDisabled]}
            onPress={handleJoinWithNickname}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLOR_WHITE} />
            ) : (
              <Text style={styles.joinButtonText}>JOIN PARTY</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              setShowNicknameInput(false);
              setPendingRoomId(null);
              setScanned(false);
            }}
            disabled={loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.scanText}>
            {loading ? 'Joining party...' : 'Point at QR code to scan'}
          </Text>
        </View>
      </View>

      {scanned && !loading && (
        <View style={styles.scanAgainContainer}>
          <Pressable
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}>
            <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLOR_WHITE} />
          <Text style={styles.loadingText}>Joining party...</Text>
        </View>
      )}

      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLOR_DARK,
  },
  permissionText: {
    color: COLOR_WHITE,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: COLOR_RED,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: COLOR_DIM,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLOR_RED,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 30,
  },
  scanText: {
    color: COLOR_WHITE,
    fontSize: 16,
  },
  scanAgainContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: COLOR_RED,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  scanAgainText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLOR_WHITE,
    fontSize: 18,
    marginTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLOR_WHITE,
    fontSize: 20,
  },
  nicknameCard: {
    backgroundColor: '#2A2A2A',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  nicknameTitle: {
    color: COLOR_WHITE,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  nicknameSubtitle: {
    color: COLOR_DIM,
    fontSize: 14,
    marginBottom: 24,
  },
  nicknameInput: {
    width: '100%',
    backgroundColor: COLOR_DARK,
    borderWidth: 2,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLOR_WHITE,
    fontSize: 18,
    marginBottom: 16,
  },
  joinButton: {
    width: '100%',
    backgroundColor: COLOR_RED,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: COLOR_DIM,
    fontSize: 14,
  },
});
