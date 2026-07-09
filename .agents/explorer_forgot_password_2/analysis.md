# Phân Tích & Đề Xuất Chiến Lược Triển Khai (Quên Mật Khẩu & OTP)

## 1. Hiện Trạng Hệ Thống & Vấn Đề Bảo Mật
Qua khảo sát các file `backend/src/services/auth.service.js`, `backend/src/controllers/auth.controller.js` và các file frontend, luồng quên/đổi mật khẩu hiện tại đang gặp một số bất cập bảo mật và nghiệp vụ:
- **Tồn tại đồng thời OTP và Reset Token**: Khi yêu cầu quên mật khẩu, backend vừa tạo OTP 6 số vừa tạo `resetToken` (32 bytes hex), lưu `resetToken` vào DB nhưng lại trả cả `resetToken` lẫn OTP về cho client.
- **Xác thực dựa vào Token thay vì OTP**: API `POST /api/v1/auth/reset-password` nhận `resetToken` để định danh và đổi mật khẩu cho User thay vì nhận OTP. Điều này làm mất đi vai trò bảo mật trực tiếp của mã OTP 6 số.
- **Tiết lộ Token trên URL/Router State**: Router state của React Router truyền trực tiếp `resetToken`, gây rủi ro lộ mã bảo mật ở phía client.

---

## 2. Giải Pháp Khắc Phục (Security Fixes)
Chúng ta sẽ chuyển đổi luồng xác thực từ **Token-based** sang hoàn toàn **OTP-based + Email**:
1. **Lưu OTP trực tiếp vào Database**: Lưu mã OTP 6 số vừa tạo thẳng vào trường `user.resetPasswordToken` trong MongoDB. Không tạo thêm bất kỳ ngẫu nhiên `resetToken` nào nữa.
2. **Xác thực bằng Email + OTP**: API đặt lại mật khẩu sẽ nhận `{ email, otp, newPassword }`. Backend tìm User bằng `email`, sau đó so sánh mã `otp` nhận được với `user.resetPasswordToken` và kiểm tra thời hạn hết hạn (`user.resetPasswordExpires`).
3. **Ẩn thông tin nhạy cảm ở Client**: Chỉ truyền `email` (và `otp` trong chế độ test) qua router state của React, tuyệt đối không truyền hay sinh ra `resetToken`.

---

## 3. Chiến Lược Triển Khai Chi Tiết (Precise Code Implementation Strategy)

### 3.1. Backend Service Layer (`backend/src/services/auth.service.js`)

#### A. Hàm `forgotPassword`
- **Trước thay đổi**: Tạo OTP và `resetToken`. Lưu `resetToken` vào DB. Trả về cả OTP và `resetToken`.
- **Đề xuất mới**: 
  - Chỉ tạo OTP 6 chữ số: `const otp = Math.floor(100000 + Math.random() * 900000).toString();`.
  - Lưu trực tiếp mã `otp` vào `user.resetPasswordToken`.
  - Không tạo `resetToken` nữa.
  - Chỉ trả về `message` và `otp` (ở chế độ test để log/hiển thị).

#### B. Hàm `resetPassword`
- **Trước thay đổi**: Nhận vào `(resetToken, newPassword)`. Dùng `UserRepository.findByResetToken(resetToken)` để tìm user và cập nhật.
- **Đề xuất mới**:
  - Nhận vào `(email, otp, newPassword)`.
  - Tìm user bằng email: Dùng `UserRepository.findByEmail` (kèm Promise bọc error-first callback).
  - So sánh `otp` với `user.resetPasswordToken`.
  - Kiểm tra `user.resetPasswordExpires` có lớn hơn `Date.now()` hay không.
  - Cập nhật mật khẩu mới (đã hash), xoá trắng `resetPasswordToken` và `resetPasswordExpires`.

---

### 3.2. Backend Controller Layer (`backend/src/controllers/auth.controller.js`)
Cập nhật handler `resetPassword` để giải nén `{ email, otp, newPassword }` từ `req.body` thay vì `{ resetToken, newPassword }` và truyền các tham số này vào `AuthService.resetPassword`.

---

### 3.3. Frontend ForgotPasswordPage (`frontend/src/pages/auth/ForgotPasswordPage.jsx`)
- Thay đổi logic điều hướng tại `onSubmit`:
  ```javascript
  navigate('/reset-password', {
    state: {
      email: data.email,
      otp: result?.otp, // Chỉ dùng cho test mode
    }
  });
  ```
- Không gửi `resetToken` trong state nữa.

---

### 3.4. Frontend ResetPasswordPage (`frontend/src/pages/auth/ResetPasswordPage.jsx`)
- Import `KeyRound` từ `lucide-react` để hiển thị icon cho ô nhập OTP.
- Thay đổi việc đọc state từ `location.state`:
  ```javascript
  const { email, otp } = location.state || {};
  ```
- Thay đổi validation kiểm tra liveness phiên: Check sự tồn tại của `email` thay vì `resetToken`. Nếu không có `email`, thông báo lỗi và chuyển hướng về `/forgot-password`.
- Thêm ô nhập mã OTP (6 số) vào form (đứng trước Mật khẩu mới):
  - Nhãn: "Mã xác thực OTP"
  - Ràng buộc: `required` (bắt buộc), `maxLength: 6`, `pattern: /^[0-9]{6}$/` (chỉ cho phép 6 chữ số).
- Cập nhật `onSubmit` gửi đi `{ email, otp: data.otp, newPassword: data.newPassword }` lên API `/auth/reset-password`.

---

## 4. Phân Tích Các Trường Hợp Biên (Edge Cases) & Khắc Phục

| Số TT | Trường hợp biên | Rủi ro | Giải pháp đề xuất |
|---|---|---|---|
| 1 | Người dùng yêu cầu OTP liên tục | Gây nghẽn hoặc lưu chồng chéo | Mỗi lần yêu cầu mới, OTP cũ bị ghi đè hoàn toàn trong DB. Ở môi trường production cần thêm giới hạn tần suất (Rate Limiting) trên route này. |
| 2 | Kẻ tấn công đoán thử OTP (Brute-force) | Mã OTP 6 số dễ bị dò quét nếu không có giới hạn | Route `/reset-password` cần được cấu hình rate limiter tối đa 5 lần thử sai liên tục cho mỗi email, sau đó khoá tài khoản/IP trong 15 phút. |
| 3 | Khớp email nhưng OTP đã hết hạn | Lỗ hổng thời gian (Time-of-check to time-of-use) | So sánh chặt chẽ `user.resetPasswordExpires` với `Date.now()`. Kiểm tra OTP trước khi tiến hành hash mật khẩu mới nhằm tối ưu hoá tài nguyên CPU. |
| 4 | Dò quét tài khoản qua API Reset Password | Kẻ tấn công nhập email lung tung để xem tài khoản nào đã đăng ký | Để tăng bảo mật, API `/reset-password` nên trả về lỗi chung chung `"Mã OTP không hợp lệ hoặc đã hết hạn"` cho cả trường hợp không tìm thấy email hoặc OTP sai/hết hạn. |
| 5 | Nhập ký tự không phải số vào ô OTP | Gửi request lỗi lên server | Phía Frontend ràng buộc `pattern: /^[0-9]{6}$/` kết hợp `type="text" inputMode="numeric"` và `maxLength={6}` để nâng cao trải nghiệm người dùng trên thiết bị di động. |
| 6 | Trùng mã OTP giữa các tài khoản khác nhau | Tìm nhầm User | Do việc tìm User được lọc chính xác theo `email` trước, sau đó mới so sánh OTP của chính User đó, việc trùng mã OTP giữa các tài khoản khác nhau không gây ảnh hưởng. |
