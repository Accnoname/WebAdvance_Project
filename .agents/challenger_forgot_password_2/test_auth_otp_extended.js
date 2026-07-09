const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const mongoose = require('mongoose');
const User = require('../../backend/src/models/User.model');
const AuthService = require('../../backend/src/services/auth.service');
const { comparePassword } = require('../../backend/src/utils/hash.util');

const runTests = async () => {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in backend/.env');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const testEmail = 'extended_otp_test@gmail.com';
    const newPassword = 'newsecurepassword123';

    // Dọn dẹp user test cũ
    await User.deleteMany({ email: testEmail });

    // Helper to create test user
    const createTestUser = async () => {
      await User.deleteMany({ email: testEmail });
      return await User.create({
        name: 'Extended OTP Test User',
        email: testEmail,
        password: 'oldpassword123',
        role: 'khach_hang'
      });
    };

    console.log('\n=========================================');
    console.log('--- Test 1: Happy Path forgot/reset ---');
    console.log('=========================================');
    await createTestUser();
    
    const forgotResult = await AuthService.forgotPassword(testEmail);
    
    // 1. Verify NO resetToken is returned by backend
    if (forgotResult.resetToken) {
      throw new Error('FAIL: resetToken was returned in forgotPassword response!');
    }
    // 2. Verify OTP is 6 digits
    if (!forgotResult.otp || forgotResult.otp.length !== 6 || !/^\d{6}$/.test(forgotResult.otp)) {
      throw new Error(`FAIL: OTP is invalid or not 6 digits: ${forgotResult.otp}`);
    }
    console.log(`[OK] forgotPassword response checked: No resetToken, valid OTP returned (${forgotResult.otp})`);

    // 3. Verify DB values
    let dbUser = await User.findOne({ email: testEmail });
    if (dbUser.resetPasswordToken !== forgotResult.otp) {
      throw new Error('FAIL: OTP is not stored in resetPasswordToken in DB!');
    }
    if (!dbUser.resetPasswordExpires || dbUser.resetPasswordExpires < Date.now()) {
      throw new Error('FAIL: resetPasswordExpires is missing or expired!');
    }
    console.log('[OK] DB values checked: OTP matches, expiry set in future');

    // 4. Reset password
    const resetResult = await AuthService.resetPassword(testEmail, forgotResult.otp, newPassword);
    console.log(`[OK] resetPassword service response: ${resetResult.message}`);

    // 5. Verify DB cleared tokens and new password matches
    const finalUser = await User.findOne({ email: testEmail }).select('+password');
    if (finalUser.resetPasswordToken !== null || finalUser.resetPasswordExpires !== null) {
      throw new Error('FAIL: resetPasswordToken or resetPasswordExpires were not cleared in DB!');
    }
    const isMatch = await comparePassword(newPassword, finalUser.password);
    if (!isMatch) {
      throw new Error('FAIL: Hashed password does not match new password in DB!');
    }
    console.log('[OK] Password reset successfully, tokens cleared, password updated');

    console.log('\n=========================================');
    console.log('--- Test 2: OTP Incorrect ---');
    console.log('=========================================');
    await createTestUser();
    const forgotResult2 = await AuthService.forgotPassword(testEmail);
    
    try {
      // Dùng sai OTP
      await AuthService.resetPassword(testEmail, '999999', newPassword);
      throw new Error('FAIL: resetPassword with incorrect OTP did not throw an error!');
    } catch (err) {
      if (err.statusCode !== 400 || !err.message.includes('Mã OTP không hợp lệ hoặc đã hết hạn')) {
        throw new Error(`FAIL: resetPassword with incorrect OTP threw unexpected error: ${err.message} (status: ${err.statusCode})`);
      }
      console.log(`[OK] resetPassword with incorrect OTP failed as expected: ${err.message} (status: ${err.statusCode})`);
    }

    console.log('\n=========================================');
    console.log('--- Test 3: OTP Expired ---');
    console.log('=========================================');
    await createTestUser();
    const forgotResult3 = await AuthService.forgotPassword(testEmail);

    // Thay đổi DB set resetPasswordExpires về quá khứ
    await User.updateOne(
      { email: testEmail },
      { $set: { resetPasswordExpires: new Date(Date.now() - 1000) } }
    );
    console.log('Manually set resetPasswordExpires in the past in DB');

    try {
      await AuthService.resetPassword(testEmail, forgotResult3.otp, newPassword);
      throw new Error('FAIL: resetPassword with expired OTP did not throw an error!');
    } catch (err) {
      if (err.statusCode !== 400 || !err.message.includes('Mã OTP không hợp lệ hoặc đã hết hạn')) {
        throw new Error(`FAIL: resetPassword with expired OTP threw unexpected error: ${err.message} (status: ${err.statusCode})`);
      }
      console.log(`[OK] resetPassword with expired OTP failed as expected: ${err.message} (status: ${err.statusCode})`);
    }

    console.log('\n=========================================');
    console.log('--- Test 4: Email Incorrect ---');
    console.log('=========================================');
    await createTestUser();
    const forgotResult4 = await AuthService.forgotPassword(testEmail);

    try {
      await AuthService.resetPassword('wrong_email@gmail.com', forgotResult4.otp, newPassword);
      throw new Error('FAIL: resetPassword with incorrect email did not throw an error!');
    } catch (err) {
      if (err.statusCode !== 400 || !err.message.includes('Mã OTP không hợp lệ hoặc đã hết hạn')) {
        throw new Error(`FAIL: resetPassword with incorrect email threw unexpected error: ${err.message} (status: ${err.statusCode})`);
      }
      console.log(`[OK] resetPassword with incorrect email failed as expected: ${err.message} (status: ${err.statusCode})`);
    }

    // Dọn dẹp
    await User.deleteMany({ email: testEmail });
    console.log('\n=========================================');
    console.log('ALL CHALLENGER TESTS PASSED SUCCESSFULLY!');
    console.log('=========================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILURE:', error.message);
    process.exit(1);
  }
};

runTests();
