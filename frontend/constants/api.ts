// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  ROOMS: {
    CREATE: '/rooms',
    GET_ALL: '/rooms',
    GET_ONE: (id: string) => `/rooms/${id}`,
    UPDATE: (id: string) => `/rooms/${id}`,
    DELETE: (id: string) => `/rooms/${id}`,
    JOIN: (id: string) => `/rooms/${id}/join`,
    LEAVE: (id: string, userId: string) => `/rooms/${id}/leave/${userId}`,
  },
};
