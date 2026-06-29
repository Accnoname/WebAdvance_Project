import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const useSocket = () => {
  const socket = useRef(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    socket.current = io('/', { auth: { token } });

    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [token]);

  const joinRoom = (room) => socket.current?.emit(room);

  const on = (event, callback) => socket.current?.on(event, callback);

  const off = (event) => socket.current?.off(event);

  return { socket: socket.current, joinRoom, on, off };
};

export default useSocket;
