let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-kitchen', () => socket.join('kitchen'));
    socket.on('join-staff', () => socket.join('staff'));
    socket.on('join-table', (tableId) => socket.join(`table:${tableId}`));

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO chưa được khởi tạo!');
  return io;
};

module.exports = { initSocket, getIO };
