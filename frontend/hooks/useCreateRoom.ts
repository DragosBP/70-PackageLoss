import { useState } from 'react';
import { createRoom, CreateRoomPayload, Room } from '../services/rooms';

export function useCreateRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const handleCreateRoom = async (payload: CreateRoomPayload) => {
    setLoading(true);
    setError(null);

    const response = await createRoom(payload);

    if (response.success && response.data) {
      setRoom(response.data);
    } else {
      setError(response.error || 'Failed to create room');
    }

    setLoading(false);
    return response;
  };

  return {
    loading,
    error,
    room,
    createRoom: handleCreateRoom,
  };
}
