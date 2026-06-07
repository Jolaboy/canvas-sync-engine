import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface CursorCoordinate { x: number; y: number; userId: string; color: string; }

export function useWebSocketCanvas(serverUrl: string, roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorCoordinate>>({});

  useEffect(() => {
    // Establish type-safe transport pipe
    socketRef.current = io(serverUrl, { transports: ['websocket'], query: { roomId } });

    socketRef.current.on('cursor-update', (payload: CursorCoordinate) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: payload
      }));
    });

    socketRef.current.on('user-disconnected', (userId: string) => {
      setRemoteCursors((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [serverUrl, roomId]);

  const broadcastPosition = (x: number, y: number) => {
    socketRef.current?.emit('mouse-move', { x, y });
  };

  return { remoteCursors, broadcastPosition };
}