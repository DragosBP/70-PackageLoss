import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function UserScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', fontSize: 16 }}>
          We need camera permissions to scan the code.
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    setLoading(true);

    try {
      // Get stored userId and fcm token from async storage (Dev 3 handles this)
      // For now, we'll use placeholder values
      const userId = 'placeholder-user-uuid';
      const fcmToken = 'placeholder-fcm-token';

      // TODO: Replace with your backend URL
      // const response = await axios.post('http://YOUR_LOCAL_IP:3000/rooms/join', {
      //   roomId: data,
      //   userId,
      //   fcmToken,
      // });

      // Mock success
      console.log(`Room ID found: ${data}`);
      alert(`Joined room: ${data}`);

      // Navigate to Lobby after joining
      router.push({
        pathname: '/room-lobby',
        params: { roomId: data },
      });
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      {scanned && (
        <View style={styles.scanAgainContainer}>
          <Button
            title={loading ? 'Joining...' : 'Tap to Scan Again'}
            onPress={() => setScanned(false)}
            disabled={loading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  scanAgainContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
