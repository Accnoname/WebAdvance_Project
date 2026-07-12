const { verifyToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/response.util');

// Middleware xác thực JWT — bắt buộc
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(sendError('Không có token xác thực', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(sendError('Token không hợp lệ hoặc đã hết hạn', 401));
  }
};

// Middleware xác thực JWT — không bắt buộc (dành cho guest order)
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Không làm gì, coi như guest
    next();
  }
};

// HOF — Higher-Order Function tạo middleware phân quyền động
const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json(sendError('Bạn không có quyền thực hiện hành động này', 403));
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate, authorizeRole };
