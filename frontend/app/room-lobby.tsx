import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';

interface Participant {
  user_id: string;
  nickname: string;
  pfp_url?: string;
}

export default function RoomLobbyScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const roomId = (route.params as any)?.roomId || 'mock-room-id-123';

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchRoomData = async () => {
    try {
      // Mock Data for testing before Dev 1 finishes:
      const mockData = [
        { user_id: '1', nickname: 'Tremendous Dog', pfp_url: '' },
        { user_id: '2', nickname: 'Sneaky Cat', pfp_url: '' },
        { user_id: '3', nickname: 'Flying Eagle', pfp_url: '' },
      ];

      // TODO: Replace with Dev 1's actual endpoint:
      // const response = await axios.get(`http://YOUR_LOCAL_IP:3000/rooms/${roomId}`);
      // setParticipants(response.data.participants);
      // setIsAdmin(response.data.admin_nickname === localAdminNickname);

      setParticipants(mockData);
      setError(null);
    } catch (err) {
      console.error('Error fetching room data', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchRoomData();

    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      fetchRoomData();
    }, 5000);

    // Cleanup interval when user leaves the screen
    return () => clearInterval(interval);
  }, [roomId]);

  const handleStartChallenge = async () => {
    if (!isAdmin) {
      alert('Only the admin can start the challenge');
      return;
    }

    try {
      // TODO: Call Dev 2's endpoint to trigger immediate challenge assignment
      // await axios.post(`http://YOUR_LOCAL_IP:3000/rooms/${roomId}/start-challenge`);
      alert('Challenge started!');
      // Navigate to challenge screen or wait for FCM notification
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert('Failed to start challenge');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      // TODO: Call Dev 1's leave endpoint
      // await axios.post(`http://YOUR_LOCAL_IP:3000/rooms/${roomId}/leave`, { userId });
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      alert('Failed to leave room');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lobby</Text>
      <Text style={styles.roomId}>Room: {roomId}</Text>
      <Text style={styles.subtitle}>
        {participants.length} participant{participants.length !== 1 ? 's' : ''}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <View style={styles.participantRow}>
              <View style={styles.participantAvatar}>
                <Text style={styles.avatarText}>
                  {item.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.participantName}>{item.nickname}</Text>
            </View>
          )}
          scrollEnabled={true}
        />
      )}

      <View style={styles.buttonContainer}>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartChallenge}
          >
            <Text style={styles.buttonText}>Start Challenge</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={handleLeaveRoom}
        >
          <Text style={styles.buttonText}>Leave Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roomId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  participantRow: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  participantName: {
    fontSize: 18,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
