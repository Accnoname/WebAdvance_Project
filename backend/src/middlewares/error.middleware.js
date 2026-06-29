const { sendError } = require('../utils/response.util');

// Custom Error class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// 404 handler
const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} không tồn tại`, 404));
};

// Global error handler — phải có 4 tham số
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Lỗi server nội bộ';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} - ${err.message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json(sendError(message, statusCode));
};

module.exports = { AppError, notFound, errorHandler };
