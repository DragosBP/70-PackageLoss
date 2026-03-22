import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChallengeRevealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetNickname?: string;
    challengeTitle?: string;
    challengeDescription?: string;
  }>();

  const targetNickname = params.targetNickname || 'Unknown';
  const challengeTitle = params.challengeTitle || 'New Challenge';
  const challengeDescription = params.challengeDescription || 'Complete the challenge!';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Challenge!</Text>

      <View style={styles.card}>
        <Text style={styles.challengeTitle}>{challengeTitle}</Text>
        <Text style={styles.challengeDescription}>{challengeDescription}</Text>

        <View style={styles.targetSection}>
          <Text style={styles.targetLabel}>YOUR TARGET</Text>
          <View style={styles.targetBox}>
            <View style={styles.targetAvatar}>
              <Text style={styles.targetAvatarText}>
                {targetNickname.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.targetName}>{targetNickname}</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>GOT IT!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E63946',
    marginBottom: 30,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#2A2A2A',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#E63946',
    marginBottom: 30,
  },
  challengeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  challengeDescription: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  targetSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  targetLabel: {
    color: '#E63946',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
  },
  targetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  targetAvatarText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 20,
  },
  targetName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#E63946',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
