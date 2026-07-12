const crypto = require('crypto');

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

// Gửi OTP quên mật khẩu — tạo token 6 số, hết hạn sau 15 phút
const forgotPassword = async (email) => {
  const user = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  // Trả về thành công dù email không tồn tại (bảo mật — không lộ email)
  if (!user) {
    return { message: 'Nếu email tồn tại, mã OTP đã được gửi' };
  }

  // Tạo OTP 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Tạo token ngẫu nhiên an toàn để dùng làm reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Lưu token (hash) và OTP vào DB, hết hạn sau 15 phút
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  await user.save();

  // TODO: Gửi email thật — hiện tại log ra console để test
  console.log(`\n🔑 [FORGOT PASSWORD] Email: ${email} | OTP: ${otp} | Token: ${resetToken}\n`);

  // Trả về OTP và token cho client (chỉ dùng khi chưa có email server)
  // Khi có email server: chỉ trả về { message } và gửi email
  return {
    message: 'Mã OTP đã được gửi đến email của bạn',
    otp,          // ⚠️ Chỉ trả về để test — xóa khi production
    resetToken,   // Dùng để xác thực bước đặt lại mật khẩu
  };
};

// Đặt lại mật khẩu bằng OTP token
const resetPassword = async (resetToken, newPassword) => {
  if (!resetToken || !newPassword) {
    throw new AppError('Token và mật khẩu mới không được để trống', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải từ 6 ký tự trở lên', 400);
  }

  const user = await new Promise((resolve, reject) => {
    UserRepository.findByResetToken(resetToken, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!user) {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400);
  }

  // Hash và lưu mật khẩu mới, xóa token
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'Đặt lại mật khẩu thành công' };
};

module.exports = { register, login, updateProfile, changePassword, forgotPassword, resetPassword };
