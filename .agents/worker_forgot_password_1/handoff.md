# Handoff Report - Forgot Password Security Fixes

## 1. Observation
- The verification script at `d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js` expects:
  1. `forgotPassword` to not return `resetToken`, but return a 6-digit `otp`.
  2. `resetPasswordToken` in the database to directly store the 6-digit OTP.
  3. `resetPassword` signature to be `(email, otp, newPassword)`.
- Replaced code segments:
  - In `backend/src/services/auth.service.js` (lines 116-179):
    ```javascript
    // Gửi OTP quên mật khẩu — tạo token 6 số, hết hạn sau 15 phút
    const forgotPassword = async (email) => { ... }
    
    // Đặt lại mật khẩu bằng OTP
    const resetPassword = async (email, otp, newPassword) => { ... }
    ```
  - In `backend/src/controllers/auth.controller.js` (lines 45-51):
    ```javascript
    const resetPassword = async (req, res, next) => {
      try {
        const { email, otp, newPassword } = req.body;
        const result = await AuthService.resetPassword(email, otp, newPassword);
        res.status(200).json(sendSuccess('Đặt lại mật khẩu thành công', result));
      } catch (error) { next(error); }
    };
    ```
  - In `frontend/src/pages/auth/ForgotPasswordPage.jsx` (lines 14-31):
    ```javascript
    const res = await authService.forgotPassword(data.email);
    const result = res.data?.data;
    setSentData(result);
    toast.success('Đã gửi mã OTP! Kiểm tra hộp thư của bạn.');
    navigate('/reset-password', {
      state: {
        email: data.email,
        otp: result?.otp,
      }
    });
    ```
  - In `frontend/src/pages/auth/ResetPasswordPage.jsx` (lines 1-40 and lines 105-140):
    - Added `KeyRound` icon import.
    - Updated state read: `const { email, otp: initialOtp } = location.state || {};`
    - Initialized `useForm` with `defaultValues: { otp: initialOtp || '' }`.
    - Added a required 6-digit OTP input field.
    - Updated `onSubmit` to pass `{ email, otp: data.otp, newPassword: data.newPassword }`.
- Run commands:
  - Command: `$env:NODE_PATH="d:\Web Nhà Hàng\backend\node_modules"; node "d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js"`
    - Result: `ALL TESTS PASSED SUCCESSFULLY!`
  - Command: `npm run build` in `d:\Web Nhà Hàng\frontend\`
    - Result: `✓ built in 6.93s`

## 2. Logic Chain
- Since the verification script tests that `resetToken` is omitted from `forgotPassword`'s return object and that `otp` is directly checked against `resetPasswordToken` in the database, we modified `forgotPassword` in `auth.service.js` to store the generated 6-digit OTP in `resetPasswordToken` and omitted `resetToken` from both DB storage and function return value.
- Since `resetToken` is no longer generated, `resetPassword` must identify the user by `email` and verify their OTP. Thus, we changed the signature of `resetPassword` to `(email, otp, newPassword)`, queried the user via `UserRepository.findByEmail`, and matched the stored `resetPasswordToken` directly against the received OTP.
- The controller `resetPassword` extracted `resetToken` previously. Now it needs to extract `email` and `otp` instead, and pass them to the service. We modified `resetPassword` in `auth.controller.js` to extract `{ email, otp, newPassword }` from `req.body`.
- On the frontend side, `ForgotPasswordPage` was passing `resetToken` and `otp` through router state. Since `resetToken` is removed, we modified it to pass `email` and `otp`.
- On `ResetPasswordPage`, the route guard redirected users back to `/forgot-password` if `resetToken` was missing. We replaced it with checking for the presence of `email`.
- `ResetPasswordPage` also needed a manual input field for OTP since users now submit OTP themselves. We added a 6-digit text input field validated by `react-hook-form` and prefilled with the test-mode `initialOtp` if available.
- Finally, the frontend build was executed (`npm run build`) to ensure the changes did not introduce any compilation or linting issues.

## 3. Caveats
- No caveats. The implementation directly meets all requirements.

## 4. Conclusion
- The security fix and updates to the forgot password and authentication flow are successfully implemented and verified. Both the backend unit tests and frontend production build run successfully without errors.

## 5. Verification Method
- **Backend Verification**:
  1. Open PowerShell.
  2. Navigate to `d:\Web Nhà Hàng\backend`.
  3. Run:
     ```powershell
     $env:NODE_PATH="d:\Web Nhà Hàng\backend\node_modules"
     node "d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js"
     ```
  4. Ensure it logs `ALL TESTS PASSED SUCCESSFULLY!`.
- **Frontend Verification**:
  1. Navigate to `d:\Web Nhà Hàng\frontend`.
  2. Run:
     ```powershell
     npm run build
     ```
  3. Ensure it compiles cleanly to `dist/`.
