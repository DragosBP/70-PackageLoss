import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { roomAPI, handleApiError, Room } from '../utils/api';
import { getOrCreateUserId } from '../services/identity';

const COLOR_RED = '#E63946';
const COLOR_GREEN = '#34C759';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_BORDER = '#3A3A3A';
const COLOR_DIM = '#666666';
const COLOR_DARKER = '#2A2A2A';

export default function RoomLobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId: string; nickname?: string }>();
  const roomId = params.roomId;

  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const initUserId = async () => {
      const id = await getOrCreateUserId();
      setUserId(id);
    };
    initUserId();
  }, []);

  const fetchRoomData = useCallback(async () => {
    if (!roomId) {
      setError('No room ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await roomAPI.getRoom(roomId);
      setRoom(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching room data', err);
      setError('Failed to load room data');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  const isAdmin = room && userId
    ? room.participants.some(
        (p) => p.user_id === userId && p.nickname === room.admin_nickname
      )
    : false;

  const handleStartChallenge = async () => {
    if (!roomId) return;
    setActionLoading(true);
    try {
      await roomAPI.startGame(roomId);
      await fetchRoomData();
      Alert.alert('Success', 'Game started!');
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !userId) return;
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await roomAPI.leaveRoom(roomId, userId);
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', handleApiError(error));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLOR_RED} />
        <Text style={styles.loadingText}>Loading lobby...</Text>
      </View>
    );
  }

  if (error || !room) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Room not found'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{room.room_name}</Text>
        <Text style={styles.roomId}>Room ID: {roomId}</Text>
        <Text style={styles.subtitle}>
          {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
        </Text>
        {room.game_started && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>GAME IN PROGRESS</Text>
          </View>
        )}
      </View>

      <FlatList
        data={room.participants}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <View style={styles.participantRow}>
            <View style={[
              styles.participantAvatar,
              item.user_id === userId && styles.currentUserAvatar
            ]}>
              <Text style={styles.avatarText}>
                {item.nickname.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[
              styles.participantName,
              item.user_id === userId && styles.currentUserName
            ]}>
              {item.nickname}
              {item.nickname === room.admin_nickname && ' (Host)'}
              {item.user_id === userId && ' (You)'}
            </Text>
          </View>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.buttonContainer}>
        {isAdmin && !room.game_started && (
          <Pressable
            style={[styles.button, styles.startButton]}
            onPress={handleStartChallenge}
            disabled={actionLoading}>
            {actionLoading ? (
              <ActivityIndicator color={COLOR_WHITE} />
            ) : (
              <Text style={styles.buttonText}>⚔ Start Game</Text>
            )}
          </Pressable>
        )}
        <Pressable
          style={[styles.button, styles.leaveButton]}
          onPress={handleLeaveRoom}
          disabled={actionLoading}>
          <Text style={styles.buttonText}>Leave Room</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLOR_DARK,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLOR_WHITE,
    marginBottom: 4,
  },
  roomId: {
    fontSize: 12,
    color: COLOR_DIM,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: COLOR_DIM,
    marginBottom: 8,
  },
  liveBadge: {
    backgroundColor: COLOR_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: COLOR_WHITE,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loadingText: {
    color: COLOR_DIM,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    color: COLOR_RED,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  participantRow: {
    padding: 14,
    backgroundColor: COLOR_DARKER,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentUserAvatar: {
    backgroundColor: COLOR_RED,
  },
  avatarText: {
    color: COLOR_WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  participantName: {
    fontSize: 16,
    color: COLOR_DIM,
    flex: 1,
  },
  currentUserName: {
    color: COLOR_WHITE,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  startButton: {
    backgroundColor: COLOR_GREEN,
  },
  leaveButton: {
    backgroundColor: COLOR_RED,
  },
  backButton: {
    backgroundColor: COLOR_RED,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});
