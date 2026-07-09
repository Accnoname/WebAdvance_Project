const path = require('path');
require('../../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
const mongoose = require('../../backend/node_modules/mongoose');
const User = require('../../backend/src/models/User.model');
const AuthService = require('../../backend/src/services/auth.service');
const { comparePassword } = require('../../backend/src/utils/hash.util');

const runTests = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const testEmail = 'challenger_otp_test@gmail.com';
    
    // Clean up any old test user
    await User.deleteMany({ email: testEmail });

    // Create test user
    console.log('Creating test user...');
    const user = await User.create({
      name: 'Challenger OTP Test User',
      email: testEmail,
      password: 'oldpassword123',
      role: 'khach_hang'
    });

    console.log('\n==================================================');
    console.log('TEST 1: Happy path - Forgot password & Reset password');
    console.log('==================================================');
    
    const forgotResult = await AuthService.forgotPassword(testEmail);
    console.log('forgotPassword result:', forgotResult);
    
    // Verify no resetToken returned
    if (forgotResult.resetToken) {
      throw new Error('FAIL: resetToken was returned in forgotPassword response!');
    }
    if (!forgotResult.otp || forgotResult.otp.length !== 6) {
      throw new Error('FAIL: OTP is missing or not 6 digits!');
    }
    console.log('Response check: PASS (no resetToken, valid 6-digit OTP)');

    // Verify DB values
    let updatedUser = await User.findOne({ email: testEmail });
    if (updatedUser.resetPasswordToken !== forgotResult.otp) {
      throw new Error('FAIL: OTP is not stored in resetPasswordToken in DB!');
    }
    if (!updatedUser.resetPasswordExpires || updatedUser.resetPasswordExpires < Date.now()) {
      throw new Error('FAIL: resetPasswordExpires is missing or already expired!');
    }
    console.log('DB value check: PASS (OTP stored, expiry is in the future)');

    // Reset password successfully
    const newPassword = 'newpassword123';
    const resetResult = await AuthService.resetPassword(testEmail, forgotResult.otp, newPassword);
    console.log('resetPassword result:', resetResult);

    // Verify DB cleared after success
    const finalUser = await User.findOne({ email: testEmail }).select('+password');
    if (finalUser.resetPasswordToken !== null || finalUser.resetPasswordExpires !== null) {
      throw new Error('FAIL: resetPasswordToken or resetPasswordExpires were not cleared in DB!');
    }
    const isMatch = await comparePassword(newPassword, finalUser.password);
    if (!isMatch) {
      throw new Error('FAIL: New password does not match or was not hashed correctly!');
    }
    console.log('Password reset verification: PASS (New password hashed, DB tokens cleared)');

    console.log('\n==================================================');
    console.log('TEST 2: OTP incorrect path');
    console.log('==================================================');
    
    // Request a new OTP
    const forgotResult2 = await AuthService.forgotPassword(testEmail);
    const correctOtp = forgotResult2.otp;
    const incorrectOtp = correctOtp === '111111' ? '222222' : '111111';

    try {
      await AuthService.resetPassword(testEmail, incorrectOtp, 'newpassword456');
      throw new Error('FAIL: Reset password succeeded with incorrect OTP!');
    } catch (error) {
      if (error.statusCode !== 400) {
        throw new Error(`FAIL: Expected status code 400, got ${error.statusCode}. Error message: ${error.message}`);
      }
      console.log('Reset password failed as expected with status code 400:', error.message);
    }

    // Verify DB is NOT cleared after failed attempt (OTP is still valid)
    const userAfterFailedOtp = await User.findOne({ email: testEmail });
    if (userAfterFailedOtp.resetPasswordToken !== correctOtp) {
      throw new Error('FAIL: resetPasswordToken was changed/cleared on failure!');
    }
    console.log('OTP incorrect check: PASS (Failed as expected, DB state retained)');

    console.log('\n==================================================');
    console.log('TEST 3: OTP expired path');
    console.log('==================================================');
    
    // Manually modify DB to set expiry in the past
    await User.updateOne({ email: testEmail }, { resetPasswordExpires: new Date(Date.now() - 5000) });
    console.log('Set resetPasswordExpires in the past (5 seconds ago)');

    try {
      await AuthService.resetPassword(testEmail, correctOtp, 'newpassword456');
      throw new Error('FAIL: Reset password succeeded with expired OTP!');
    } catch (error) {
      if (error.statusCode !== 400) {
        throw new Error(`FAIL: Expected status code 400, got ${error.statusCode}. Error message: ${error.message}`);
      }
      console.log('Reset password failed as expected with status code 400:', error.message);
    }
    console.log('OTP expired check: PASS (Failed as expected with status code 400)');

    console.log('\n==================================================');
    console.log('TEST 4: Email incorrect path');
    console.log('==================================================');
    
    // Re-generate OTP for a clean state
    const forgotResult3 = await AuthService.forgotPassword(testEmail);
    const freshOtp = forgotResult3.otp;

    try {
      await AuthService.resetPassword('nonexistent_user@gmail.com', freshOtp, 'newpassword456');
      throw new Error('FAIL: Reset password succeeded with incorrect email!');
    } catch (error) {
      if (error.statusCode !== 400) {
        throw new Error(`FAIL: Expected status code 400, got ${error.statusCode}. Error message: ${error.message}`);
      }
      console.log('Reset password failed as expected with status code 400:', error.message);
    }
    console.log('Email incorrect check: PASS (Failed as expected with status code 400)');

    // Clean up
    await User.deleteMany({ email: testEmail });
    console.log('\nALL EMPIRICAL TESTS PASSED SUCCESSFULLY!');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\nTEST EXCEPTION:', error);
    if (mongoose.connection.readyState !== 0) {
      mongoose.connection.close();
    }
    process.exit(1);
  }
};

runTests();
