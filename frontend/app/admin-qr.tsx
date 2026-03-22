import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useRoute } from '@react-navigation/native';

export default function AdminQRScreen() {
  const route = useRoute();
  const roomId = (route.params as any)?.roomId || 'mock-room-id-123';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan to Join the Party!</Text>
      <View style={styles.qrContainer}>
        <QRCode
          value={roomId}
          size={250}
          color="black"
          backgroundColor="white"
        />
      </View>
      <Text style={styles.subtitle}>Room ID: {roomId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
});
