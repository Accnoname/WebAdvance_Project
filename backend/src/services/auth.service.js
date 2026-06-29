const UserRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');
const { AppError } = require('../middlewares/error.middleware');

const register = async (userData) => {
  // TODO: Implement
  throw new AppError('Chưa implement', 501);
};

const login = async (email, password) => {
  // TODO: Implement
  throw new AppError('Chưa implement', 501);
};

module.exports = { register, login };
