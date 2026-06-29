require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Kết nối database
    await connectDB();

    // Tạo HTTP server từ Express app
    const server = http.createServer(app);

    // Khởi tạo Socket.IO
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📁 Môi trường: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Lỗi khởi động server:', error);
    process.exit(1);
  }
};

startServer();
