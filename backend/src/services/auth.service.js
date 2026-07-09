const crypto = require('crypto');

const UserRepository = require('../repositories/user.repository');
const User = require('../models/User.model');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');
const { AppError } = require('../middlewares/error.middleware');
const { sendEmail } = require('../utils/email.util');

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

  // Lưu OTP trực tiếp vào resetPasswordToken, hết hạn sau 15 phút
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  await user.save();

  const isTestMode = !process.env.EMAIL_PASS || process.env.EMAIL_PASS.includes('xxxx');

  if (isTestMode) {
    // Chế độ TEST: Chỉ in ra console và trả về OTP cho frontend
    console.log(`\n🔑 [FORGOT PASSWORD - TEST MODE] Email: ${email} | OTP: ${otp}\n`);
    return {
      message: 'Mã OTP đã được gửi đến email của bạn (Chế độ TEST)',
      otp, 
    };
  }

  // Chế độ GỬI MAIL THẬT
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #ea580c; text-align: center;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
      <p>Chào bạn <strong>${user.name}</strong>,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Nhà Hàng Accnoname</strong>.</p>
      <div style="background-color: #f7fee7; border: 1px dashed #84cc16; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 14px; color: #4d7c0f; display: block; margin-bottom: 5px;">Mã xác thực OTP của bạn là:</span>
        <strong style="font-size: 32px; font-family: monospace; letter-spacing: 5px; color: #15803d;">${otp}</strong>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Mã OTP này có giá trị trong vòng <strong>15 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Đây là email tự động từ hệ thống quản lý nhà hàng.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: '[Nhà Hàng Accnoname] Mã OTP Xác Thực Đặt Lại Mật Khẩu',
      html: htmlContent
    });
    console.log(`\n📧 [FORGOT PASSWORD] Email OTP đã gửi thành công tới: ${email}\n`);
    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
    };
  } catch (error) {
    console.error('❌ Lỗi gửi email thật:', error.message);
    // Nếu lỗi gửi mail thật, fallback tạm thời in ra console để tránh nghẽn luồng test
    console.log(`\n🔑 [FORGOT PASSWORD - FALLBACK] Email: ${email} | OTP: ${otp}\n`);
    return {
      message: 'Mã OTP đã được gửi đến email của bạn (Chế độ TEST)',
      otp,
    };
  }
};

// Đặt lại mật khẩu bằng OTP
const resetPassword = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw new AppError('Email, mã OTP và mật khẩu mới không được để trống', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải từ 6 ký tự trở lên', 400);
  }

  const user = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!user || user.resetPasswordToken !== otp || !user.resetPasswordExpires || user.resetPasswordExpires <= Date.now()) {
    throw new AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400);
  }

  // Hash và lưu mật khẩu mới, xóa token
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'Đặt lại mật khẩu thành công' };
};

module.exports = { register, login, updateProfile, changePassword, forgotPassword, resetPassword };
