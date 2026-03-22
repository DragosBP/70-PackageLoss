import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { roomAPI, handleApiError, Room, ChallengeStatus } from '../utils/api';
import { ChallengeCard } from '../components/ChallengeCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { scheduleLocalChallengeAssignedNotification } from '../services/notifications';
import * as Clipboard from 'expo-clipboard';

const COLOR_RED = '#E63946';
const COLOR_GREEN = '#34C759';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_BORDER = '#3A3A3A';
const COLOR_DIM = '#666666';
const COLOR_DARKER = '#2A2A2A';

export default function RoomAdminScreen() {
  const router = useRouter();
  const { roomId, nickname, userId } = useLocalSearchParams<{
    roomId?: string;
    nickname?: string;
    userId?: string;
  }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [challengeStatuses, setChallengeStatuses] = useState<ChallengeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');
  const [adminChallengeStatus, setAdminChallengeStatus] = useState<ChallengeStatus | null>(null);
  const lastAdminChallengeKeyRef = useRef<string | null>(null);

  // Toast state
  const [toastOpacity] = useState(new Animated.Value(0));
  const [toastVisible, setToastVisible] = useState(false);

  // Modal states
  const [startGameConfirmVisible, setStartGameConfirmVisible] = useState(false);
  const [stopGameConfirmVisible, setStopGameConfirmVisible] = useState(false);
  const [endPartyConfirmVisible, setEndPartyConfirmVisible] = useState(false);
  const [regenerateChallengesConfirmVisible, setRegenerateChallengesConfirmVisible] = useState(false);

  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await roomAPI.getRoom(roomId);
      setRoom(response.data);

      if (response.data.game_started) {
        const statusResponse = await roomAPI.getAllChallengeStatuses(roomId);
        setChallengeStatuses(statusResponse.data);

        if (userId) {
          try {
            const adminStatusResponse = await roomAPI.getChallengeStatus(roomId, userId);
            const nextStatus = adminStatusResponse.data;
            const challengeId = nextStatus.assigned_challenge?._id;
            const challengeAssignedAt = nextStatus.challenge_assigned_at;
            const nextChallengeKey = challengeId && challengeAssignedAt
              ? `${challengeId}:${challengeAssignedAt}`
              : null;

            if (
              nextChallengeKey &&
              lastAdminChallengeKeyRef.current &&
              nextChallengeKey !== lastAdminChallengeKeyRef.current
            ) {
              void scheduleLocalChallengeAssignedNotification({
                challengeTitle: nextStatus.assigned_challenge?.title,
                challengeDescription: nextStatus.assigned_challenge?.description,
                targetNickname: nextStatus.target_nickname || undefined,
              });
            }

            if (nextChallengeKey && !lastAdminChallengeKeyRef.current) {
              lastAdminChallengeKeyRef.current = nextChallengeKey;
            } else if (nextChallengeKey) {
              lastAdminChallengeKeyRef.current = nextChallengeKey;
            }

            setAdminChallengeStatus(nextStatus);
          } catch {
            setAdminChallengeStatus(null); // Admin might not have challenge assigned yet
            lastAdminChallengeKeyRef.current = null;
          }
        }
      } else {
        setChallengeStatuses([]);
        setAdminChallengeStatus(null);
        lastAdminChallengeKeyRef.current = null;
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, userId]);

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const handleCopyCode = async () => {
    if (!roomId) return;
    await Clipboard.setStringAsync(roomId as string);
    showToast();
  };

  const handleMarkComplete = async () => {
    if (!roomId || !userId) return;
    setActionLoading(true);
    try {
      await roomAPI.markChallengeComplete(roomId, userId);
      await fetchRoomData();
      Alert.alert('Success', 'Your challenge marked as complete!');
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!roomId) return;
    setActionLoading(true);
    try {
      await roomAPI.startGame(roomId);
      await fetchRoomData();
      setStartGameConfirmVisible(false);
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopGame = async () => {
    if (!roomId) return;
    setActionLoading(true);
    try {
      await roomAPI.stopGame(roomId);
      await fetchRoomData();
      setStopGameConfirmVisible(false);
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndParty = async () => {
    if (!roomId || !nickname) return;
    setActionLoading(true);
    try {
      await roomAPI.endRoom(roomId, nickname as string);
      setEndPartyConfirmVisible(false);
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
      setActionLoading(false);
    }
  };

  const handleRegenerateChallenges = async () => {
    if (!roomId) return;
    setActionLoading(true);
    try {
      await roomAPI.regenerateChallenges(roomId);
      await fetchRoomData();
      setRegenerateChallengesConfirmVisible(false);
    } catch (error) {
      Alert.alert('Error', handleApiError(error));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_RED} />
          <Text style={styles.loadingText}>Loading room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Room not found</Text>
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

  const normalizeAvatarUri = (avatar?: string): string | null => {
    const value = avatar?.trim();
    if (!value) {
      return null;
    }

    if (value.startsWith('data:image/')) {
      return value;
    }

    if (/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      return `data:image/jpeg;base64,${value}`;
    }

    return null;
  };

  const getParticipantAvatarUri = (participant?: { pfp_base64?: string }): string | null => {
    if (!participant) {
      return null;
    }

    return normalizeAvatarUri(participant.pfp_base64);
  };

  const adminTargetParticipant = room.participants.find(
    (participant) => participant.user_id === adminChallengeStatus?.target_user_id,
  );
  const adminTargetAvatarUri = getParticipantAvatarUri(adminTargetParticipant);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>ADMIN CONTROL</Text>
          <Text style={styles.roomName}>{room.room_name}</Text>
          <Text style={styles.roomId}>ID: {roomId}</Text>
        </View>

        {room.game_started && (
          <View style={styles.viewToggleContainer}>
            <Pressable
              style={[styles.toggleButton, viewMode === 'admin' && styles.activeToggle]}
              onPress={() => setViewMode('admin')}>
              <Text style={[styles.toggleText, viewMode === 'admin' && styles.activeToggleText]}>
                👑 ADMIN VIEW
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, viewMode === 'user' && styles.activeToggle]}
              onPress={() => setViewMode('user')}>
              <Text style={[styles.toggleText, viewMode === 'user' && styles.activeToggleText]}>
                🎯 MY CHALLENGE
              </Text>
            </Pressable>
          </View>
        )}

        {viewMode === 'admin' ? (
          <>
            <Pressable style={styles.qrToggle} onPress={() => setShowQR(!showQR)}>
              <Text style={styles.qrToggleText}>
                {showQR ? '▼ Hide QR Code' : '▶ Show QR Code to Join'}
              </Text>
            </Pressable>

            {showQR && (
              <View style={styles.qrContainer}>
                <QRCode value={roomId} size={200} color="black" backgroundColor="white" />
                <Text style={styles.qrHint}>Scan to join the party</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{room.participants.length}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: room.game_started ? COLOR_GREEN : COLOR_DIM }]}>
                  {room.game_started ? 'LIVE' : 'WAITING'}
                </Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
              {room.game_started && (
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{getTimeRemaining()}</Text>
                  <Text style={styles.statLabel}>Next Round</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PARTICIPANTS</Text>
              {room.participants.map((participant) => {
                const status = challengeStatuses.find((s) => s.user_id === participant.user_id);
                const participantAvatarUri = getParticipantAvatarUri(participant);
                return (
                  <View key={participant.user_id} style={styles.participantRow}>
                    <View style={styles.participantAvatar}>
                      {participantAvatarUri ? (
                        <Image source={{ uri: participantAvatarUri }} style={styles.participantAvatarImage} />
                      ) : (
                        <Text style={styles.avatarText}>
                          {participant.nickname.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {participant.nickname}
                        {participant.nickname === room.admin_nickname && ' (Admin)'}
                      </Text>
                      {status && status.assigned_challenge && (
                        <Text style={styles.participantChallenge}>
                          → {status.target_nickname}: {status.assigned_challenge.title}
                          {status.is_challenge_completed && ' ✓'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>GAME CONTROLS</Text>

              {!room.game_started ? (
                <>
                  <Pressable
                    style={[styles.actionButton, styles.copyButton]}
                    onPress={handleCopyCode}
                    disabled={actionLoading}>
                    <Text style={styles.actionButtonText}>📋 COPY CODE</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => setStartGameConfirmVisible(true)}
                    disabled={actionLoading}>
                    {actionLoading ? (
                      <ActivityIndicator color={COLOR_WHITE} />
                    ) : (
                      <Text style={styles.actionButtonText}>⚔ START GAME</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={[styles.actionButton, styles.regenerateButton]}
                    onPress={() => setRegenerateChallengesConfirmVisible(true)}
                    disabled={actionLoading}>
                    {actionLoading ? (
                      <ActivityIndicator color={COLOR_WHITE} />
                    ) : (
                      <Text style={styles.actionButtonText}>🔄 REGENERATE CHALLENGES</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.stopButton]}
                    onPress={() => setStopGameConfirmVisible(true)}
                    disabled={actionLoading}>
                    {actionLoading ? (
                      <ActivityIndicator color={COLOR_WHITE} />
                    ) : (
                      <Text style={styles.actionButtonText}>⏸ STOP GAME</Text>
                    )}
                  </Pressable>
                </>
              )}

              <Pressable
                style={[styles.actionButton, styles.endButton]}
                onPress={() => setEndPartyConfirmVisible(true)}
                disabled={actionLoading}>
                <Text style={styles.actionButtonText}>🚪 END PARTY</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ChallengeCard
            challengeStatus={adminChallengeStatus}
            onMarkComplete={handleMarkComplete}
            actionLoading={actionLoading}
            timeRemaining={getTimeRemaining()}
            isAdmin={true}
            targetAvatarUri={adminTargetAvatarUri}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>✓ Code copied!</Text>
        </Animated.View>
      )}

      {/* Modals */}
      <ConfirmationModal
        visible={startGameConfirmVisible}
        title="Start Game"
        message="Are you ready to start the game? All participants will receive their first challenge."
        confirmText="Start Game"
        cancelText="Cancel"
        isDangerous={false}
        isLoading={actionLoading}
        icon="⚔️"
        onConfirm={handleStartGame}
        onCancel={() => setStartGameConfirmVisible(false)}
      />

      <ConfirmationModal
        visible={stopGameConfirmVisible}
        title="Stop Game"
        message="Are you sure you want to stop the game? Participants can still see their current challenges."
        confirmText="Stop Game"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={actionLoading}
        icon="⏸️"
        onConfirm={handleStopGame}
        onCancel={() => setStopGameConfirmVisible(false)}
      />

      <ConfirmationModal
        visible={regenerateChallengesConfirmVisible}
        title="Regenerate Challenges"
        message="Assign new challenges to all participants? They will receive notifications with their new targets."
        confirmText="Regenerate"
        cancelText="Cancel"
        isDangerous={false}
        isLoading={actionLoading}
        icon="🔄"
        onConfirm={handleRegenerateChallenges}
        onCancel={() => setRegenerateChallengesConfirmVisible(false)}
      />

      <ConfirmationModal
        visible={endPartyConfirmVisible}
        title="End Party"
        message="Are you sure you want to end this party? This cannot be undone and all participants will be disconnected."
        confirmText="End Party"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={actionLoading}
        icon="🚪"
        onConfirm={handleEndParty}
        onCancel={() => setEndPartyConfirmVisible(false)}
      />
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
    color: COLOR_RED,
    letterSpacing: 2,
    marginBottom: 8,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLOR_WHITE,
    marginBottom: 4,
  },
  roomId: {
    fontSize: 12,
    color: COLOR_DIM,
    fontFamily: 'monospace',
  },
  qrToggle: {
    backgroundColor: COLOR_DARKER,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  qrToggleText: {
    color: COLOR_WHITE,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: COLOR_WHITE,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrHint: {
    color: COLOR_DARK,
    fontSize: 12,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLOR_DARKER,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    color: COLOR_WHITE,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: COLOR_DIM,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLOR_RED,
    fontSize: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLOR_RED,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarText: {
    color: COLOR_WHITE,
    fontWeight: 'bold',
    fontSize: 18,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  participantChallenge: {
    color: COLOR_DIM,
    fontSize: 12,
    marginTop: 4,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  actionButtonText: {
    color: COLOR_WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: '#007AFF',
  },
  startButton: {
    backgroundColor: COLOR_GREEN,
  },
  regenerateButton: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    backgroundColor: COLOR_BORDER,
  },
  endButton: {
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
  bottomSpacer: {
    height: 40,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLOR_DARKER,
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: COLOR_RED,
  },
  toggleText: {
    color: COLOR_DIM,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  activeToggleText: {
    color: COLOR_WHITE,
  },
  toast: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: COLOR_GREEN,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: COLOR_WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
});
