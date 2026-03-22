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
  // Hook-ul tău care se ocupă de request-ul către Backend
  const { createRoom, loading, error } = useCreateRoom();
  
  const [roomName, setRoomName] = useState('');
  const [adminNickname, setAdminNickname] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreateRoom = async () => {
    // 1. Validări locale simple
    if (!roomName.trim() || !adminNickname.trim()) {
      Alert.alert('Eroare', 'Numele camerei și porecla sunt obligatorii.');
      return;
    }

    // 2. Construim obiectul de trimis (Payload)
    // Trimitem doar câmpurile de care Backend-ul are nevoie
    const payload: any = {
      room_name: roomName.trim(),
      admin_nickname: adminNickname.trim(),
    };

    // Adăugăm data doar dacă user-ul a scris ceva (evităm string gol "")
    if (expiresAt.trim().length > 0) {
      payload.expires_at = expiresAt.trim();
    }

    // 3. Apelăm funcția din Hook
    const result = await createRoom(payload);

    // 4. Verificăm rezultatul
    if (result && result.success && result.data) {
      Alert.alert('Succes', `Camera "${roomName}" a fost creată!`);
      
      // Resetăm câmpurile
      setRoomName('');
      setAdminNickname('');
      setExpiresAt('');
      
      // Anunțăm părintele că am terminat
      if (onRoomCreated) {
        onRoomCreated(result.data._id);
      }
    }
  };

  // Sugestie de dată (1 oră în viitor)
  const suggestedExpiry = new Date(Date.now() + 3600000).toISOString();

  return (
    <SlideUpView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Crează Cameră Nouă
        </ThemedText>

        {/* Nume Cameră */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Numele Camerei</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ex: Cabana Păltiniș"
            placeholderTextColor="#999"
            value={roomName}
            onChangeText={setRoomName}
            editable={!loading}
          />
        </View>

        {/* Poreclă Admin */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Porecla Ta (Admin)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ex: Sasu"
            placeholderTextColor="#999"
            value={adminNickname}
            onChangeText={setAdminNickname}
            editable={!loading}
          />
        </View>

        {/* Expirare */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Expirare (Format ISO - Opțional)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD..."
            placeholderTextColor="#999"
            value={expiresAt}
            onChangeText={setExpiresAt}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={() => setExpiresAt(suggestedExpiry)}
            style={styles.hintButton}
          >
            <ThemedText style={styles.hint}>
              💡 Pune automat: +1 oră
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Buton Creare */}
        <View style={styles.buttonContainer}>
          <PressButton
            title={loading ? 'Se creează...' : 'Crează Camera'}
            onPress={handleCreateRoom}
            loading={loading}
            disabled={loading}
            color="#34C759"
          />
        </View>

        {/* AFIȘARE ERORI (Aici am reparat eroarea ta) */}
        {error && (
          <ThemedText style={styles.errorText}>
            ⚠️ {Array.isArray(error) ? error.join(', ') : error}
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
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  hintButton: {
    marginTop: 6,
  },
  hint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: 'bold',
  },
});