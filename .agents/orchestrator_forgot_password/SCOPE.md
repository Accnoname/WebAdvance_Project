# Scope: Forgot Password Security Fix

## Architecture
This scope addresses security flaws in the Forgot Password and Authentication flow.
- **Backend Components**:
  - `backend/src/services/auth.service.js` (Hàm `forgotPassword` và `resetPassword` logic)
  - `backend/src/controllers/auth.controller.js` (Hàm `resetPassword` API handler)
- **Frontend Components**:
  - `frontend/src/pages/auth/ForgotPasswordPage.jsx` (Giao diện gửi OTP, không gửi/nhận `resetToken` nữa)
  - `frontend/src/pages/auth/ResetPasswordPage.jsx` (Giao diện đặt lại mật khẩu với ô nhập OTP 6 số)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Exploration | Inspect existing auth files, routes, and tests | None | DONE |
| M2 | Backend Implementation | Update auth service & controller to use OTP for reset | M1 | DONE |
| M3 | Frontend Update | Update forgot & reset password forms with OTP | M2 | DONE |
| M4 | E2E Testing & Audit | Run tests, verify OTP code, audit with Forensic Auditor | M3 | DONE |

## Interface Contracts
### Client ↔ Server Auth Flow
#### `POST /api/v1/auth/forgot-password`
- **Request Body**:
  ```json
  {
    "email": "customer@example.com"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Mã OTP đã được gửi đến email của bạn",
    "data": {
      "message": "Mã OTP đã được gửi đến email của bạn",
      "otp": "123456"
    }
  }
  ```

#### `POST /api/v1/auth/reset-password`
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "otp": "123456",
    "newPassword": "newsecurepassword"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Đặt lại mật khẩu thành công",
    "data": {
      "message": "Đặt lại mật khẩu thành công"
    }
  }
  ```
