import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

export interface Participant {
  user_id: string;
  nickname: string;
  pfp_base64?: string;
  pfp_url?: string;
  fcm_token?: string;
  last_active?: string;
}

export interface CreateRoomPayload {
  room_name: string;
  admin_nickname: string;
  expires_at?: string;
  participants?: Participant[];
  active_alerts?: string[];
}

export interface Room {
  _id: string;
  room_name: string;
  admin_nickname: string;
  expires_at: string;
  participants: Participant[];
  active_alerts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new room
 */
export async function createRoom(
  payload: CreateRoomPayload,
): Promise<ApiResponse<Room>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ROOMS.CREATE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to create room',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get all rooms
 */
export async function getAllRooms(): Promise<ApiResponse<Room[]>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ROOMS.GET_ALL}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to fetch rooms',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get a specific room by ID
 */
export async function getRoomById(roomId: string): Promise<ApiResponse<Room>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ROOMS.GET_ONE(roomId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'Room not found',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Join a room
 */
export async function joinRoom(
  roomId: string,
  participant: Participant,
): Promise<ApiResponse<Room>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ROOMS.JOIN(roomId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participant),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to join room',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Leave a room
 */
export async function leaveRoom(
  roomId: string,
  userId: string,
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ROOMS.LEAVE(roomId, userId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to leave room',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
