## 2026-07-09T12:25:45Z
<USER_REQUEST>
You are teamwork_preview_challenger. Your working directory is d:\Web Nhà Hàng\.agents\challenger_forgot_password_2.
Your task is to empirically verify the correctness of the new forgot password and authentication flows.
Specifically:
1. Examine the implementation in the codebase (backend services, controller, frontend pages).
2. Write and run a test harness or script (or run `node d:\Web Nhà Hàng\.agents\explorer_forgot_password_2\test_auth_otp.js` and extend it if necessary) to verify:
   - Happy path: `forgotPassword` creates a 6-digit OTP, stores it in DB, returns it to client, and reset works using email + OTP.
   - OTP incorrect: Attempt reset password with correct email but incorrect OTP. Ensure it fails (status code 400).
   - OTP expired: Modify DB values manually (in test code) to set `resetPasswordExpires` in the past. Attempt reset and ensure it fails.
   - Email incorrect: Attempt reset with incorrect email. Ensure it fails.
   - Verify that NO `resetToken` is returned by the backend or used by the frontend.
3. Verify that the frontend builds successfully (`npm run build` inside `frontend/`).
4. Write your findings and verification logs to `d:\Web Nhà Hàng\.agents\challenger_forgot_password_2\handoff.md`.
</USER_REQUEST>
