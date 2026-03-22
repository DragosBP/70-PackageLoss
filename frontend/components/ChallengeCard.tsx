import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChallengeStatus } from '../utils/api';

const COLOR_RED = '#E63946';
const COLOR_GREEN = '#34C759';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_BORDER = '#3A3A3A';
const COLOR_DIM = '#666666';
const COLOR_DARKER = '#2A2A2A';
const COLOR_GOLD = '#FFD700';

interface ChallengeCardProps {
  challengeStatus: ChallengeStatus | null;
  onMarkComplete: () => Promise<void>;
  actionLoading: boolean;
  timeRemaining: string | null;
  isAdmin?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challengeStatus,
  onMarkComplete,
  actionLoading,
  timeRemaining,
  isAdmin = false,
}) => {
  if (!challengeStatus?.assigned_challenge) {
    return (
      <View style={styles.waitingCard}>
        <Text style={styles.waitingEmoji}>🎯</Text>
        <Text style={styles.waitingText}>
          {isAdmin ? 'No challenge assigned yet' : 'Getting your challenge...'}
        </Text>
        <Text style={styles.waitingSubtext}>
          {isAdmin
            ? 'Your challenge will appear when the game starts or regenerates'
            : 'Your mission will appear soon'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeLabel}>
          {isAdmin ? 'YOUR ADMIN MISSION' : 'YOUR MISSION'}
        </Text>
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
          onPress={onMarkComplete}
          disabled={actionLoading}>
          {actionLoading ? (
            <ActivityIndicator color={COLOR_DARK} />
          ) : (
            <Text style={styles.completeButtonText}>✓ MARK COMPLETE</Text>
          )}
        </Pressable>
      )}

      {timeRemaining && (
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>Next challenge in</Text>
          <Text style={styles.timerValue}>{timeRemaining}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    borderWidth: 2,
    borderColor: COLOR_RED,
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
    textAlign: 'center',
  },
});