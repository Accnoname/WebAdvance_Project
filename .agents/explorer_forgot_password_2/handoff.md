# Handoff Report: Forgot Password Security Fixes

## 1. Observation
We examined the current forgot/reset password flow and observed:
- In `backend/src/services/auth.service.js`:
  - **Line 131**: `const otp = Math.floor(100000 + Math.random() * 900000).toString();`
  - **Line 133**: `const resetToken = crypto.randomBytes(32).toString('hex');`
  - **Line 136**: `user.resetPasswordToken = resetToken;` (It stores the hexadecimal `resetToken` instead of the 6-digit `otp` in the database).
  - **Lines 145-149**: It returns both `otp` and `resetToken` to the client.
  - **Line 153**: `const resetPassword = async (resetToken, newPassword) => {`
- In `backend/src/controllers/auth.controller.js`:
  - **Lines 47-48**:
    ```javascript
    const { resetToken, newPassword } = req.body;
    const result = await AuthService.resetPassword(resetToken, newPassword);
    ```
- In `frontend/src/pages/auth/ForgotPasswordPage.jsx`:
  - **Lines 20-27**:
    ```javascript
    navigate('/reset-password', {
      state: {
        resetToken: result?.resetToken,
        // ⚠️ chỉ dùng khi test — otp hiển thị trực tiếp
        otp: result?.otp,
      }
    });
    ```
- In `frontend/src/pages/auth/ResetPasswordPage.jsx`:
  - **Lines 16-25**:
    ```javascript
    // Lấy resetToken và otp từ state khi chuyển trang từ ForgotPasswordPage
    const { resetToken, otp } = location.state || {};
    const newPassword = watch('newPassword');

    // Nếu không có resetToken → redirect về forgot-password
    useEffect(() => {
      if (!resetToken) {
        toast.error('Phiên làm việc không hợp lệ. Vui lòng thực hiện lại từ đầu.');
        navigate('/forgot-password', { replace: true });
      }
    }, [resetToken, navigate]);
    ```
  - **Lines 27-32**:
    ```javascript
    const onSubmit = async (data) => {
      try {
        await authService.resetPassword({
          resetToken,
          newPassword: data.newPassword,
        });
    ```
- In `backend/src/repositories/user.repository.js`:
  - **Lines 20-27**:
    ```javascript
    // Tìm user có reset token hợp lệ và chưa hết hạn
    findByResetToken: (token, callback) => {
      User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      })
    ```

---

## 2. Logic Chain
1. Since the current flow relies on the client sending `resetToken` in `POST /api/v1/auth/reset-password` and the server matching it, the OTP itself plays no role in password resets.
2. Under the new security model, `resetToken` should be abolished. The server must verify resets based on the user's `email` and the `otp` directly.
3. Therefore:
   - In `forgotPassword` service: Stop creating `resetToken`. Save the `otp` string directly to `user.resetPasswordToken` and set `user.resetPasswordExpires`.
   - In `resetPassword` service: Change inputs to `(email, otp, newPassword)`. Find the user by `email`, compare `user.resetPasswordToken` directly to the `otp` argument, and check that `user.resetPasswordExpires` is in the future.
   - In the controller: Extract `email` and `otp` instead of `resetToken` from request body and pass them to the service.
   - In `ForgotPasswordPage.jsx`: Pass `email` in router state instead of `resetToken`.
   - In `ResetPasswordPage.jsx`: Check for `email` presence instead of `resetToken` to guard the page view. Read the OTP from a new required input field. Submit `email`, `otp`, and `newPassword` on submission.

---

## 3. Caveats
- **Rate Limiting**: Changing the reset mechanism to OTP makes it susceptible to brute-forcing if no rate limiter is installed. Although we noted this in the edge case analysis, actual configuration of a rate limiter (e.g., `express-rate-limit`) is out-of-scope for the requested fixes but highly recommended.
- **Obsolete Repository Method**: `UserRepository.findByResetToken` will become dead code. It can be safely removed or ignored during implementation.

---

## 4. Conclusion
We recommend proceeding with the implementation of the OTP-only authentication flow. The required changes have been captured in a precise diff patch at `d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\forgot_password_security_fix.patch`.

---

## 5. Verification Method
We created a verification test script at `d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js`.

### How to Run:
Once the implementer applies the changes, run:
```powershell
node d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js
```
**Expected Output**:
```
Connecting to database...
Connected.
Creating test user...
--- Test 1: forgotPassword OTP-only generation ---
forgotPassword response checked: PASS (No resetToken, valid OTP returned)
DB values checked: PASS (OTP stored in resetPasswordToken and valid expiry set)
--- Test 2: resetPassword with OTP and Email ---
resetPassword result: Đặt lại mật khẩu thành công
Password reset verification: PASS (New password hashed, DB tokens cleared)

ALL TESTS PASSED SUCCESSFULLY!
```
**Invalidation Conditions**:
- If `resetToken` is still returned in `forgotPassword`, or `resetPasswordToken` in DB does not match the OTP, the script will throw an error and exit with code 1.
