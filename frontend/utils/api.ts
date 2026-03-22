import axios from 'axios';

// TODO: Update this with your backend URL
// For development, use your local IP: http://192.168.x.x:3000
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Room APIs
export const roomAPI = {
  // Get room data by ID
  getRoom: (roomId: string) => apiClient.get(`/rooms/${roomId}`),

  // Join a room
  joinRoom: (roomId: string, userId: string, fcmToken: string) =>
    apiClient.post('/rooms/join', {
      roomId,
      userId,
      fcmToken,
    }),

  // Leave a room
  leaveRoom: (roomId: string, userId: string) =>
    apiClient.post(`/rooms/${roomId}/leave`, {
      userId,
    }),

  // Start challenge (admin only)
  startChallenge: (roomId: string) =>
    apiClient.post(`/rooms/${roomId}/start-challenge`),

  // End room (admin only)
  endRoom: (roomId: string) =>
    apiClient.post(`/rooms/${roomId}/end`),
};

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
