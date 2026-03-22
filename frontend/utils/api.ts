import axios from 'axios';

// TODO: Update this with your backend URL
// For development, use your local IP: http://192.168.x.x:3000
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.40.4.91:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface ParticipantDto {
  user_id: string;
  nickname: string;
  pfp_base64?: string;
  pfp_url?: string;
  fcm_token?: string;
}

export interface CreateRoomDto {
  room_name: string;
  admin_nickname: string;
  expires_at?: string;
  participants?: ParticipantDto[];
}

export interface Participant {
  user_id: string;
  nickname: string;
  pfp_base64: string;
  fcm_token: string;
  last_active: string;
  assigned_challenge_id: string | null;
  target_user_id: string | null;
  challenge_assigned_at: string | null;
  is_challenge_completed: boolean;
}

export interface Room {
  _id: string;
  room_name: string;
  admin_nickname: string;
  created_at: string;
  expires_at: string;
  participants: Participant[];
  game_started: boolean;
  game_started_at: string | null;
  next_challenge_regeneration: string | null;
}

export interface ChallengeStatus {
  user_id: string;
  nickname: string;
  assigned_challenge: {
    _id: string;
    title: string;
    description: string;
  } | null;
  target_user_id: string | null;
  target_nickname: string | null;
  challenge_assigned_at: string | null;
  is_challenge_completed: boolean;
}

// Room APIs
export const roomAPI = {
  // Create a new room
  createRoom: (data: CreateRoomDto) =>
    apiClient.post<Room>('/rooms', data),

  // Get room data by ID
  getRoom: (roomId: string) =>
    apiClient.get<Room>(`/rooms/${roomId}`),

  // Join a room - POST /rooms/action/join/:id
  joinRoom: (roomId: string, participant: ParticipantDto) =>
    apiClient.post<Room>(`/rooms/action/join/${roomId}`, participant),

  // Leave a room - DELETE /rooms/action/leave/:id/:userId
  leaveRoom: (roomId: string, userId: string) =>
    apiClient.delete(`/rooms/action/leave/${roomId}/${userId}`),

  // End room (admin only) - DELETE /rooms/action/end/:id?nickname=...
  endRoom: (roomId: string, adminNickname: string) =>
    apiClient.delete(`/rooms/action/end/${roomId}?nickname=${encodeURIComponent(adminNickname)}`),

  // Start game (admin only) - POST /rooms/:roomId/start-game
  startGame: (roomId: string) =>
    apiClient.post<Room>(`/rooms/${roomId}/start-game`),

  // Stop game (admin only) - POST /rooms/:roomId/stop-game
  stopGame: (roomId: string) =>
    apiClient.post<Room>(`/rooms/${roomId}/stop-game`),

  // Get challenge status for a user
  getChallengeStatus: (roomId: string, userId: string) =>
    apiClient.get<ChallengeStatus>(`/rooms/${roomId}/challenges/status/${userId}`),

  // Get all challenge statuses (admin view)
  getAllChallengeStatuses: (roomId: string) =>
    apiClient.get<ChallengeStatus[]>(`/rooms/${roomId}/challenges/statuses`),

  // Mark challenge as complete
  markChallengeComplete: (roomId: string, userId: string) =>
    apiClient.patch<Room>(`/rooms/${roomId}/challenges/complete`, { user_id: userId }),

  // Manually regenerate challenges (admin only)
  regenerateChallenges: (roomId: string) =>
    apiClient.post<Room>(`/rooms/${roomId}/challenges/regenerate`),
};

// Challenge APIs
export const challengeAPI = {
  // Get all challenges
  getAllChallenges: () => apiClient.get('/challenges'),

  // Get a single challenge
  getChallenge: (id: string) => apiClient.get(`/challenges/${id}`),
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
