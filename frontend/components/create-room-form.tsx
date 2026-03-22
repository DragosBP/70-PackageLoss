import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useCreateRoom } from '../hooks/useCreateRoom';
import { SlideUpView } from './animated-views';
import { PressButton } from './press-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export interface CreateRoomFormProps {
  onRoomCreated?: (roomId: string) => void;
}

export default function CreateRoomForm({ onRoomCreated }: CreateRoomFormProps) {
  const { createRoom, loading, error } = useCreateRoom();
  const [roomName, setRoomName] = useState('');
  const [adminNickname, setAdminNickname] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Eroare', 'Numele camerei este necesar');
      return;
    }

    if (!adminNickname.trim()) {
      Alert.alert('Eroare', 'Porecla admin-ului este necesară');
      return;
    }

    if (!expiresAt.trim()) {
      Alert.alert('Eroare', 'Data expirării este necesară');
      return;
    }

    const response = await createRoom({
      room_name: roomName,
      admin_nickname: adminNickname,
      expires_at: expiresAt,
    });

    if (response.success && response.data) {
      Alert.alert('Succes', `Camera "${roomName}" a fost creată!`);
      setRoomName('');
      setAdminNickname('');
      setExpiresAt('');
      if (onRoomCreated) {
        onRoomCreated(response.data._id);
      }
    } else {
      Alert.alert('Eroare', error || 'Eroare la crearea camerei');
    }
  };

  const suggestedExpiry = new Date(Date.now() + 3600000).toISOString();

  return (
    <SlideUpView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Crează Cameră Nouă
        </ThemedText>

        {/* Room Name */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Numele Camerei</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ex: Team Meeting"
            placeholderTextColor="#999"
            value={roomName}
            onChangeText={setRoomName}
            editable={!loading}
            maxLength={100}
          />
        </View>

        {/* Admin Nickname */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Porecla Admin</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ex: John"
            placeholderTextColor="#999"
            value={adminNickname}
            onChangeText={setAdminNickname}
            editable={!loading}
            maxLength={64}
          />
        </View>

        {/* Expires At */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Expirează la</ThemedText>
          <TextInput
            style={styles.input}
            placeholder={suggestedExpiry}
            placeholderTextColor="#999"
            value={expiresAt}
            onChangeText={setExpiresAt}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setExpiresAt(suggestedExpiry)}>
            <ThemedText style={styles.hint}>
              💡 Cu 1 oră de acum
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <PressButton
            title={loading ? 'Se creează...' : 'Crează Camera'}
            onPress={handleCreateRoom}
            loading={loading}
            disabled={loading}
            color="#34C759"
          />
        </View>

        {/* Error */}
        {error && (
          <ThemedText style={styles.errorText}>
            ⚠️ {error}
          </ThemedText>
        )}
      </ThemedView>
    </SlideUpView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  content: {
    borderRadius: 12,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  hint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 6,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
});
