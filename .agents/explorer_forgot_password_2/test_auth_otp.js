const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const mongoose = require('mongoose');
const User = require('../../backend/src/models/User.model');
const AuthService = require('../../backend/src/services/auth.service');
const { comparePassword } = require('../../backend/src/utils/hash.util');

const runTests = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const testEmail = 'otp_test_user@gmail.com';
    // Dọn dẹp user test cũ
    await User.deleteMany({ email: testEmail });

    // Tạo user mới
    console.log('Creating test user...');
    const user = await User.create({
      name: 'OTP Test User',
      email: testEmail,
      password: 'oldpassword123',
      role: 'khach_hang'
    });

    console.log('--- Test 1: forgotPassword OTP-only generation ---');
    const forgotResult = await AuthService.forgotPassword(testEmail);
    
    // Kiểm tra kết quả trả về
    if (forgotResult.resetToken) {
      throw new Error('FAIL: resetToken was returned in forgotPassword response!');
    }
    if (!forgotResult.otp || forgotResult.otp.length !== 6) {
      throw new Error('FAIL: OTP is missing or not 6 digits!');
    }
    console.log('forgotPassword response checked: PASS (No resetToken, valid OTP returned)');

    // Kiểm tra DB
    const updatedUser = await User.findOne({ email: testEmail });
    if (updatedUser.resetPasswordToken !== forgotResult.otp) {
      throw new Error('FAIL: OTP is not stored directly in resetPasswordToken in DB!');
    }
    if (!updatedUser.resetPasswordExpires || updatedUser.resetPasswordExpires < Date.now()) {
      throw new Error('FAIL: resetPasswordExpires is missing or expired!');
    }
    console.log('DB values checked: PASS (OTP stored in resetPasswordToken and valid expiry set)');

    console.log('--- Test 2: resetPassword with OTP and Email ---');
    const newPassword = 'newpassword123';
    
    // Gọi resetPassword
    const resetResult = await AuthService.resetPassword(testEmail, forgotResult.otp, newPassword);
    console.log('resetPassword result:', resetResult.message);

    // Kiểm tra DB sau khi reset
    const finalUser = await User.findOne({ email: testEmail }).select('+password');
    if (finalUser.resetPasswordToken !== null || finalUser.resetPasswordExpires !== null) {
      throw new Error('FAIL: resetPasswordToken or resetPasswordExpires were not cleared in DB!');
    }
    
    const isMatch = await comparePassword(newPassword, finalUser.password);
    if (!isMatch) {
      throw new Error('FAIL: New password does not match!');
    }
    console.log('Password reset verification: PASS (New password hashed, DB tokens cleared)');

    // Dọn dẹp
    await User.deleteMany({ email: testEmail });
    console.log('\nALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('TEST EXCEPTION:', error.message);
    process.exit(1);
  }
};

runTests();
