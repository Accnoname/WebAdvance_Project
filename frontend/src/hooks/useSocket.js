import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const useSocket = (room = null) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    socketRef.current.on('connect', () => {
      console.log('Đã kết nối Socket:', socketRef.current.id);
      
      if (room) {
        if (room.startsWith('table:')) {
          const tableId = room.split(':')[1];
          socketRef.current.emit('join-table', tableId);
        } else {
          socketRef.current.emit(`join-${room}`);
        }
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Đã ngắt kết nối Socket');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [room]);

  return socketRef.current;
};

export default useSocket;
