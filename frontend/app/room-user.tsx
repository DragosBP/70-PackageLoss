import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View, Pressable } from 'react-native';

export default function RoomUserScreen() {
  const router = useRouter();
  const { room, nickname } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PARTY ROOM</Text>
        <Text style={styles.roomCode}>{room}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Room Code: {room}</Text>
        <Text style={styles.label}>Your Nickname: {nickname}</Text>

        <Text style={styles.placeholder}>
          User room interface and challenge display will be implemented here.
        </Text>
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Leave Room</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#E63946',
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E63946',
    letterSpacing: 2,
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#E63946',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
