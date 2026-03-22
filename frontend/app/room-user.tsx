import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { roomAPI, handleApiError, Room, ChallengeStatus } from '../utils/api';
import { getOrCreateUserId } from '../services/identity';

const COLOR_RED = '#E63946';
const COLOR_GREEN = '#34C759';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_BORDER = '#3A3A3A';
const COLOR_DIM = '#666666';
const COLOR_DARKER = '#2A2A2A';
const COLOR_GOLD = '#FFD700';

export default function RoomUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomId: string;
    nickname: string;
    userId: string;
  }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(params.userId || null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const initUserId = async () => {
      if (!userId) {
        const id = await getOrCreateUserId();
        setUserId(id);
      }
    };
    initUserId();
  }, [userId]);

  const fetchRoomData = useCallback(async () => {
    if (!params.roomId || !userId) return;
    try {
      const response = await roomAPI.getRoom(params.roomId);
      setRoom(response.data);

      if (response.data.game_started) {
        try {
          const statusResponse = await roomAPI.getChallengeStatus(params.roomId, userId);
          setChallengeStatus(statusResponse.data);
        } catch {
          setChallengeStatus(null);
        }
      } else {
        setChallengeStatus(null);
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.roomId, userId]);

  useEffect(() => {
    if (userId) {
      fetchRoomData();
      const interval = setInterval(fetchRoomData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchRoomData, userId]);

  const handleMarkComplete = async () => {
    if (!params.roomId || !userId) return;
    setActionLoading(true);
    try {
      await roomAPI.markChallengeComplete(params.roomId, userId);
      await fetchRoomData();
      Alert.alert('Success', 'Challenge marked as complete!');
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!params.roomId || !userId) return;
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this party?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await roomAPI.leaveRoom(params.roomId, userId);
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_RED} />
          <Text style={styles.loadingText}>Loading party...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Room not found or expired</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const getTimeRemaining = () => {
    if (!room.next_challenge_regeneration) return null;
    const next = new Date(room.next_challenge_regeneration).getTime();
    const now = Date.now();
    const diff = Math.max(0, next - now);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{room.room_name}</Text>
          <Text style={styles.subtitle}>
            {room.game_started ? '🔥 GAME IN PROGRESS' : '⏳ Waiting for game to start...'}
          </Text>
        </View>

        {room.game_started && challengeStatus?.assigned_challenge ? (
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeLabel}>YOUR MISSION</Text>
              {challengeStatus.is_challenge_completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ DONE</Text>
                </View>
              )}
            </View>

            <Text style={styles.challengeTitle}>
              {challengeStatus.assigned_challenge.title}
            </Text>

            <Text style={styles.challengeDescription}>
              {challengeStatus.assigned_challenge.description}
            </Text>

            <View style={styles.targetSection}>
              <Text style={styles.targetLabel}>TARGET</Text>
              <View style={styles.targetBox}>
                <View style={styles.targetAvatar}>
                  <Text style={styles.targetAvatarText}>
                    {challengeStatus.target_nickname?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={styles.targetName}>
                  {challengeStatus.target_nickname || 'Unknown'}
                </Text>
              </View>
            </View>

            {!challengeStatus.is_challenge_completed && (
              <Pressable
                style={styles.completeButton}
                onPress={handleMarkComplete}
                disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator color={COLOR_DARK} />
                ) : (
                  <Text style={styles.completeButtonText}>✓ MARK COMPLETE</Text>
                )}
              </Pressable>
            )}

            {room.next_challenge_regeneration && (
              <View style={styles.timerSection}>
                <Text style={styles.timerLabel}>Next challenge in</Text>
                <Text style={styles.timerValue}>{getTimeRemaining()}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingEmoji}>🎉</Text>
            <Text style={styles.waitingText}>
              {room.game_started
                ? 'Getting your challenge...'
                : 'Waiting for the host to start the game'}
            </Text>
            <Text style={styles.waitingSubtext}>
              {room.participants.length} participants in the party
            </Text>
          </View>
        )}

        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>PARTY MEMBERS</Text>
          {room.participants.map((participant) => (
            <View key={participant.user_id} style={styles.participantRow}>
              <View style={[
                styles.participantAvatar,
                participant.user_id === userId && styles.currentUserAvatar
              ]}>
                <Text style={styles.avatarText}>
                  {participant.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[
                styles.participantName,
                participant.user_id === userId && styles.currentUserName
              ]}>
                {participant.nickname}
                {participant.nickname === room.admin_nickname && ' (Host)'}
                {participant.user_id === userId && ' (You)'}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.leaveButton}
          onPress={handleLeaveRoom}
          disabled={actionLoading}>
          <Text style={styles.leaveButtonText}>🚪 LEAVE PARTY</Text>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_DARK,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLOR_DIM,
    fontSize: 16,
  },
  errorText: {
    color: COLOR_RED,
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLOR_RED,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLOR_WHITE,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLOR_DIM,
    letterSpacing: 1,
  },
  challengeCard: {
    backgroundColor: COLOR_DARKER,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLOR_RED,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeLabel: {
    color: COLOR_RED,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  completedBadge: {
    backgroundColor: COLOR_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: COLOR_WHITE,
    fontSize: 10,
    fontWeight: '700',
  },
  challengeTitle: {
    color: COLOR_WHITE,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  challengeDescription: {
    color: COLOR_DIM,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  targetSection: {
    marginBottom: 20,
  },
  targetLabel: {
    color: COLOR_RED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_DARK,
    padding: 12,
    borderRadius: 8,
  },
  targetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLOR_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  targetAvatarText: {
    color: COLOR_DARK,
    fontWeight: 'bold',
    fontSize: 20,
  },
  targetName: {
    color: COLOR_WHITE,
    fontSize: 20,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: COLOR_GOLD,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  completeButtonText: {
    color: COLOR_DARK,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerSection: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
  },
  timerLabel: {
    color: COLOR_DIM,
    fontSize: 12,
  },
  timerValue: {
    color: COLOR_WHITE,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  waitingCard: {
    backgroundColor: COLOR_DARKER,
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  waitingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  waitingText: {
    color: COLOR_WHITE,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubtext: {
    color: COLOR_DIM,
    fontSize: 14,
  },
  participantsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLOR_RED,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_DARKER,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 14,
  },
  participantName: {
    color: COLOR_DIM,
    fontSize: 14,
  },
  currentUserName: {
    color: COLOR_WHITE,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: COLOR_RED,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
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
  bottomSpacer: {
    height: 40,
  },
});
