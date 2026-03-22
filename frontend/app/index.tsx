import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getOrCreateUserId } from '../services/identity';
import { getNativePushToken } from '../services/notifications';
import { uploadProfileImage } from '../services/storage';
import { roomAPI, handleApiError } from '../utils/api';

const COLOR_RED = '#E63946';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_BORDER = '#3A3A3A';
const COLOR_DIM = '#666666';
const COLOR_DARKER = '#2A2A2A';

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mugshot, setMugshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createInFlightRef = useRef(false);
  const joinInFlightRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const handleMugshot = async () => {
    const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissions.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setMugshot(result.assets[0].uri);
    }
  };

  const createBeef = async () => {
    if (createInFlightRef.current) {
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    createInFlightRef.current = true;
    setLoading(true);
    try {
      const userId = await getOrCreateUserId();
      const fcmToken = await getNativePushToken();

      // Create room without participants first (to get roomId)
      const response = await roomAPI.createRoom({
        room_name: `${nickname}'s Party`,
        admin_nickname: nickname,
        participants: [], // Empty initially
      });

      const roomId = response.data._id;

      // Upload image to Firebase Storage if present
      let pfp_url = '';
      if (mugshot) {
        try {
          pfp_url = await uploadProfileImage(roomId, userId, mugshot);
        } catch (uploadError) {
          console.error('Failed to upload profile image:', uploadError);
          // Continue without image if upload fails
        }
      }

      // Join the room as first participant with the image URL
      await roomAPI.joinRoom(roomId, {
        user_id: userId,
        nickname: nickname,
        pfp_url: pfp_url,
        pfp_base64: '', // Keep for backward compatibility
        fcm_token: fcmToken || '',
      });

      router.push({
        pathname: '/room-admin',
        params: {
          roomId,
          nickname,
          userId,
          mugshot: pfp_url || mugshot || '',
        },
      });
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      createInFlightRef.current = false;
      setLoading(false);
    }
  };

  const joinBeef = async () => {
    if (joinInFlightRef.current) {
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    joinInFlightRef.current = true;
    setLoading(true);
    try {
      const userId = await getOrCreateUserId();
      const fcmToken = await getNativePushToken();

      // Upload image to Firebase Storage if present
      let pfp_url = '';
      if (mugshot) {
        try {
          pfp_url = await uploadProfileImage(roomCode.trim(), userId, mugshot);
        } catch (uploadError) {
          console.error('Failed to upload profile image:', uploadError);
          // Continue without image if upload fails
        }
      }

      await roomAPI.joinRoom(roomCode.trim(), {
        user_id: userId,
        nickname: nickname,
        pfp_url: pfp_url,
        pfp_base64: '', // Keep for backward compatibility
        fcm_token: fcmToken || '',
      });

      router.push({
        pathname: '/room-user',
        params: {
          roomId: roomCode.trim(),
          nickname,
          userId,
          mugshot: pfp_url || mugshot || '',
        },
      });
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      joinInFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0F0F0F', '#1A1A1A', '#2A0A0A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoBorder}>
              <Text style={styles.logoText}>BEEF</Text>
            </View>
            <Text style={styles.headerTitle}>Enter The Ring</Text>
            <Text style={styles.headerSubtitle}>Party Challenge Game</Text>
          </View>

          <View style={styles.section}>
            <Pressable style={styles.mugshotContainer} onPress={() => void handleMugshot()}>
              {mugshot ? (
                <Animated.Image
                  source={{ uri: mugshot }}
                  style={[styles.mugshotImage, { transform: [{ scale: pulseAnim }] }]}
                />
              ) : (
                <View style={styles.mugshotPlaceholder}>
                  <Text style={styles.mugshotIcon}>📸</Text>
                  <Text style={styles.mugshotLabel}>Upload Mugshot</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              style={styles.input}
              placeholder="ENTER NICKNAME"
              placeholderTextColor="#444"
              value={nickname}
              onChangeText={setNickname}
              maxLength={64}
              editable={!loading}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Choose Your Fight</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.createButton, { opacity: pressed || loading ? 0.8 : 1 }]}
            onPress={() => void createBeef()}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLOR_WHITE} size="small" />
            ) : (
              <Text style={styles.createButtonText}>⚔ CREATE NEW BEEF</Text>
            )}
          </Pressable>

          <View style={styles.joinContainer}>
            <TextInput
              style={styles.roomCodeInput}
              placeholder="ROOM ID"
              placeholderTextColor="#444"
              value={roomCode}
              onChangeText={setRoomCode}
              maxLength={24}
              autoCapitalize="none"
              editable={!loading}
            />
            <Pressable
              style={({ pressed }) => [styles.joinButton, { opacity: pressed || loading ? 0.8 : 1 }]}
              onPress={() => void joinBeef()}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLOR_WHITE} size="small" />
              ) : (
                <Text style={styles.joinButtonText}>JOIN BEEF</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={styles.scanButton}
            onPress={() => router.push({ pathname: '/scanner' as any, params: { nickname, mugshot: mugshot ?? '' } })}
            disabled={loading}>
            <Text style={styles.scanButtonText}>📷 SCAN QR CODE</Text>
          </Pressable>

          <Text style={styles.tagline}>No mercy. No excuses.</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBorder: {
    borderWidth: 4,
    borderColor: COLOR_RED,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 16,
  },
  logoText: {
    fontFamily: 'System',
    fontSize: 60,
    fontWeight: '900',
    color: COLOR_RED,
    letterSpacing: 4,
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    color: COLOR_WHITE,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'System',
    fontSize: 14,
    color: COLOR_DIM,
    letterSpacing: 1,
  },
  section: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  mugshotContainer: {
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_DARK,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mugshotImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  mugshotPlaceholder: {
    alignItems: 'center',
  },
  mugshotIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mugshotLabel: {
    fontFamily: 'System',
    fontSize: 12,
    color: COLOR_DIM,
    letterSpacing: 2,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_DARK,
    color: COLOR_WHITE,
    fontFamily: 'System',
    fontSize: 18,
    letterSpacing: 3,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLOR_DARKER,
  },
  dividerText: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#444',
    letterSpacing: 2,
  },
  createButton: {
    width: '100%',
    backgroundColor: COLOR_RED,
    paddingVertical: 20,
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
  joinContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roomCodeInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_DARK,
    color: COLOR_WHITE,
    fontFamily: 'System',
    fontSize: 14,
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    textAlign: 'center',
  },
  joinButton: {
    borderWidth: 2,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_DARKER,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  joinButtonText: {
    color: COLOR_WHITE,
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2,
  },
  scanButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_DARKER,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scanButtonText: {
    color: COLOR_DIM,
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#333',
    letterSpacing: 2,
    marginTop: 40,
  },
});
