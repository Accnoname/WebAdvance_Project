## 2026-07-09T05:23:55Z
You are teamwork_preview_worker. Your working directory is d:\Web Nhà Hàng\.agents\worker_forgot_password_1.
Your task is to implement the security fixes and updates to the forgot password and authentication flow as analyzed by the Explorers.

Please implement the following changes in d:\Web Nhà Hàng:
1. In `backend/src/services/auth.service.js`:
   - Modify `forgotPassword` to:
     - Generate a 6-digit OTP (e.g. `Math.floor(100000 + Math.random() * 900000).toString()`).
     - Save the OTP directly in `user.resetPasswordToken`.
     - Set `user.resetPasswordExpires` to 15 minutes in the future.
     - Delete any logic that generates or returns `resetToken`. Return only `{ message, otp }` (the otp is for test mode).
     - Keep the console.log of the OTP for test mode: `console.log(`\n🔑 [FORGOT PASSWORD] Email: ${email} | OTP: ${otp}\n`);`.
   - Modify `resetPassword` to:
     - Change its signature to `(email, otp, newPassword)`.
     - Validate that all arguments `email`, `otp`, `newPassword` are present.
     - Validate that `newPassword` has length >= 6.
     - Query user by email using `UserRepository.findByEmail`.
     - Check that user exists, `user.resetPasswordToken === otp`, and `user.resetPasswordExpires && user.resetPasswordExpires > Date.now()`. If not, throw an AppError('Mã OTP không hợp lệ hoặc đã hết hạn', 400).
     - Hash the new password, clear `resetPasswordToken` and `resetPasswordExpires` (set to `null`), and save the user.
2. In `backend/src/controllers/auth.controller.js`:
   - Modify `resetPassword` to extract `{ email, otp, newPassword }` from `req.body` and pass them to `AuthService.resetPassword(email, otp, newPassword)`.
3. In `frontend/src/pages/auth/ForgotPasswordPage.jsx`:
   - Modify navigation to `/reset-password` in `onSubmit` to pass `email` and `otp` (from the response) in the state, instead of `resetToken` and `otp`.
4. In `frontend/src/pages/auth/ResetPasswordPage.jsx`:
   - Modify the page to read `email` and `otp` from `location.state` instead of `resetToken` and `otp`.
   - Modify the initial `useEffect` redirect guard to check for the presence of `email` instead of `resetToken`.
   - Add a required, validated OTP 6-digit text input field to the form, with key `otp` (registered via react-hook-form). It should require 6 digits and show appropriate error messages.
   - Update `onSubmit` to call `authService.resetPassword({ email, otp: data.otp, newPassword: data.newPassword })`.

Verify your implementation:
- Run the verification script: `node d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js` to verify backend logic.
- Ensure that the frontend builds successfully without any linting or compile errors (you can run `npm run build` in the `frontend` directory).
- Document your verification commands and outputs in your handoff report.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your final handoff report to `d:\Web Nhà Hàng\.agents\worker_forgot_password_1\handoff.md`.
