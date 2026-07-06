const UserRepository = require('../repositories/user.repository');
const User = require('../models/User.model');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');
const { AppError } = require('../middlewares/error.middleware');

const register = async (userData) => {
  // 1. Kiểm tra email đã tồn tại
  const existingUser = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(userData.email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (existingUser) {
    throw new AppError('Email đã được sử dụng', 409);
  }

  // 2. Hash password
  const hashedPassword = await hashPassword(userData.password);

  // 3. Tạo user mới
  const newUser = await new Promise((resolve, reject) => {
    UserRepository.create({
      ...userData,
      password: hashedPassword,
      // Mặc định role là khach_hang, trừ khi có logic tạo staff riêng
      role: 'khach_hang',
    }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  // 4. Tạo token
  const token = generateToken({
    _id: newUser._id,
    role: newUser.role,
  });

  return { user: newUser, token };
};

const login = async (email, password) => {
  // 1. Tìm user theo email kèm mật khẩu
  const user = await new Promise((resolve, reject) => {
    UserRepository.findByEmailWithPassword(email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  // 2. So sánh mật khẩu
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  // 3. Tạo token
  const token = generateToken({
    _id: user._id,
    role: user.role,
  });

  return { user, token };
};

const updateProfile = async (userId, data) => {
  if (!data.name) {
    throw new AppError('Họ và tên không được để trống', 400);
  }
  const updatedUser = await new Promise((resolve, reject) => {
    UserRepository.updateById(userId, { name: data.name, phone: data.phone }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
  if (!updatedUser) {
    throw new AppError('Người dùng không tồn tại', 404);
  }
  return updatedUser;
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  if (!oldPassword || !newPassword) {
    throw new AppError('Mật khẩu cũ và mật khẩu mới không được để trống', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải từ 6 ký tự trở lên', 400);
  }

  const userWithPass = await User.findById(userId).select('+password');
  if (!userWithPass) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  const isMatch = await comparePassword(oldPassword, userWithPass.password);
  if (!isMatch) {
    throw new AppError('Mật khẩu cũ không chính xác', 401);
  }

  const hashedNewPassword = await hashPassword(newPassword);
  userWithPass.password = hashedNewPassword;
  await userWithPass.save();

  return { success: true };
};

module.exports = { register, login, updateProfile, changePassword };
