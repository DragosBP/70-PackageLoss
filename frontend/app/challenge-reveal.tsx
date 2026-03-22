import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ChallengeRevealScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // Data passed from the Push Notification payload
  const {
    targetNickname = 'Sneaky Cat',
    challengeText = 'Take a selfie doing a silly pose with them.',
  } = (route.params as any) || {};

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚨 New Challenge! 🚨</Text>

      <View style={styles.card}>
        <Text style={styles.targetLabel}>Your Target:</Text>
        <Text style={styles.targetName}>{targetNickname}</Text>

        <Text style={styles.challengeLabel}>Your Mission:</Text>
        <Text style={styles.challengeText}>{challengeText}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Got it!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  targetLabel: {
    color: '#aaa',
    fontSize: 16,
  },
  targetName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  challengeLabel: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 20,
  },
  challengeText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
