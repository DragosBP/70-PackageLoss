import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SlideUpView, FadeInView } from './animated-views';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { getAllRooms, Room } from '../services/rooms';

interface RoomsListProps {
  onRoomPress?: (roomId: string) => void;
}

export function RoomsList({ onRoomPress }: RoomsListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    const response = await getAllRooms();
    if (response.success && response.data) {
      setRooms(response.data);
    } else {
      setError(response.error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  if (loading && rooms.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Se încarcă camerele...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
      </ThemedView>
    );
  }

  if (rooms.length === 0) {
    return (
      <FadeInView style={styles.centerContainer}>
        <ThemedText style={styles.emoji}>📭</ThemedText>
        <ThemedText style={styles.emptyText}>
          Nu sunt camere disponibile
        </ThemedText>
      </FadeInView>
    );
  }

  return (
    <SlideUpView style={{ flex: 1 }}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 50}>
            <TouchableOpacity
              onPress={() => onRoomPress?.(item._id)}
              activeOpacity={0.7}
            >
              <ThemedView style={styles.roomCard}>
                <ThemedText style={styles.roomName}>
                  {item.room_name}
                </ThemedText>
                <ThemedText style={styles.roomInfo}>
                  👤 {item.participants.length} membri • Admin:{' '}
                  {item.admin_nickname}
                </ThemedText>
                <ThemedText style={styles.roomMeta}>
                  ⏱️ {new Date(item.expires_at).toLocaleString()}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </FadeInView>
        )}
      />
    </SlideUpView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  roomCard: {
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roomInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomMeta: {
    fontSize: 12,
    color: '#999',
  },
});
