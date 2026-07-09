# Handoff Report: Forgot Password Security Fix Analysis

## 1. Observation (Quan sát)
Qua khảo sát và kiểm tra mã nguồn thực tế của hệ thống, tôi ghi nhận các thông tin kỹ thuật sau:

- **Dịch vụ Auth Backend (`backend/src/services/auth.service.js`)**:
  - Hàm `forgotPassword` hiện tại đang sinh ra cả `otp` và `resetToken` và trả cả hai về client:
    ```javascript
    131:   const otp = Math.floor(100000 + Math.random() * 900000).toString();
    132:   const resetToken = crypto.randomBytes(32).toString('hex');
    ...
    145:   return {
    146:     message: 'Mã OTP đã được gửi đến email của bạn',
    147:     otp,          // ⚠️ Chỉ trả về để test — xóa khi production
    148:     resetToken,   // Dùng để xác thực bước đặt lại mật khẩu
    149:   };
    ```
  - Hàm `resetPassword` tìm kiếm người dùng chỉ dựa trên `resetToken`:
    ```javascript
    153: const resetPassword = async (resetToken, newPassword) => {
    ...
    161:   const user = await new Promise((resolve, reject) => {
    162:     UserRepository.findByResetToken(resetToken, (err, doc) => { ... });
    ```
- **Controller Auth Backend (`backend/src/controllers/auth.controller.js`)**:
  - API handler `resetPassword` nhận `resetToken` từ client gửi lên:
    ```javascript
    45: const resetPassword = async (req, res, next) => {
    46:   try {
    47:     const { resetToken, newPassword } = req.body;
    48:     const result = await AuthService.resetPassword(resetToken, newPassword);
    ```
- **Trang Quên Mật Khẩu (`frontend/src/pages/auth/ForgotPasswordPage.jsx`)**:
  - Chuyển tiếp `resetToken` sang trang đặt lại mật khẩu bằng cách đính kèm vào state của React Router:
    ```javascript
    21:       navigate('/reset-password', {
    22:         state: {
    23:           resetToken: result?.resetToken,
    24:           otp: result?.otp,
    25:         }
    26:       });
    ```
- **Trang Đặt Lại Mật Khẩu (`frontend/src/pages/auth/ResetPasswordPage.jsx`)**:
  - Đọc `resetToken` từ `location.state` và kiểm tra sự tồn tại của nó để điều hướng:
    ```javascript
    16:   const { resetToken, otp } = location.state || {};
    ...
    20:   useEffect(() => {
    21:     if (!resetToken) {
    22:       toast.error('Phiên làm việc không hợp lệ. Vui lòng thực hiện lại từ đầu.');
    23:       navigate('/forgot-password', { replace: true });
    24:     }
    25:   }, [resetToken, navigate]);
    ```
  - Form hiện chỉ có hai trường: Mật khẩu mới và Xác nhận mật khẩu, không có ô nhập mã OTP cho người dùng.

---

## 2. Logic Chain (Chuỗi lập luận)
1. **Lưu trữ OTP thay cho Token**: Vì `resetPasswordToken` trong schema `User` có kiểu dữ liệu là `String`, nó hoàn toàn tương thích để lưu trữ trực tiếp mã OTP 6 chữ số thay vì mã hex token 32 bytes ngẫu nhiên.
2. **Cơ chế xác thực Direct OTP**: Bằng cách lưu OTP trực tiếp vào trường `resetPasswordToken` trên database, server có thể xác thực người dùng bằng cách tìm kiếm theo `email` rồi so khớp OTP. Điều này loại bỏ hoàn toàn nhu cầu về `resetToken` trung gian, hạn chế việc rò rỉ token thông qua Client State.
3. **Thay đổi API Reset Password**: Khi bỏ `resetToken`, client bắt buộc phải gửi `{ email, otp, newPassword }` để server định danh và xác thực. Vì thế, endpoint `POST /api/v1/auth/reset-password` cần cập nhật controller nhận đúng 3 trường dữ liệu này.
4. **Cập nhật giao diện**: Trang `ResetPasswordPage` cần cung cấp ô nhập mã OTP để người dùng có thể nhập mã 6 số nhận được qua email, đồng thời kiểm tra tính hợp lệ (bắt buộc nhập, phải đủ 6 chữ số) trước khi gửi đi.

---

## 3. Caveats (Lưu ý)
- **Tấn công vét cạn OTP**: 6 chữ số là độ dài tương đối ngắn và dễ bị tấn công brute-force nếu route `/reset-password` không được bảo vệ bằng Rate Limiting. Do đó, cần khuyến nghị bổ sung middleware chống spam yêu cầu hoặc giới hạn số lần nhập sai.
- **Mất State khi F5/Reload**: Người dùng tải lại trang `ResetPasswordPage` sẽ bị đẩy về `ForgotPasswordPage` do mất `email` trong `location.state`. Đây là thiết kế bảo mật hợp lý nhưng cần làm rõ để tránh gây hiểu nhầm cho đội phát triển.
- **Log bảo mật**: Hiện tại OTP vẫn được in ra ở console của server để test. Khi triển khai lên production, cần đảm bảo tắt hoặc ẩn log này đi để tránh lỗ hổng lộ thông tin qua file log hệ thống.

---

## 4. Conclusion (Kết luận)
Phương án chuyển đổi từ xác thực dựa trên Token sang xác thực trực tiếp bằng OTP là khả thi, an toàn hơn và không yêu cầu thay đổi cấu trúc Database Schema hiện có. 

Chi tiết đề xuất triển khai cụ thể:
1. **Backend Service**: Thay đổi `forgotPassword` để lưu trực tiếp OTP vào `resetPasswordToken`, xóa logic tạo/trả về `resetToken`. Cập nhật `resetPassword` để nhận `(email, otp, newPassword)`, đối chiếu OTP và kiểm tra thời hạn.
2. **Backend Controller**: Cập nhật handler `resetPassword` để giải nén `{ email, otp, newPassword }` từ `req.body`.
3. **Frontend Page (Forgot)**: Ngừng gửi `resetToken`, chỉ truyền `email` và `otp` (chế độ test) qua React Router State.
4. **Frontend Page (Reset)**: Thêm ô nhập mã OTP 6 chữ số bắt buộc, đổi kiểm tra redirect từ `resetToken` sang `email`, và gửi đầy đủ `{ email, otp, newPassword }` lên Backend.

---

## 5. Verification Method (Phương pháp xác thực)
Để xác minh độc lập các đề xuất trên sau khi cài đặt:

- **Kiểm tra luồng API backend**:
  - Chạy backend và dùng công cụ REST client gửi request `POST /api/v1/auth/forgot-password` với body `{ "email": "customer@example.com" }`. Response phải chứa `"otp"` nhưng không được chứa `"resetToken"`.
  - Gửi request `POST /api/v1/auth/reset-password` với body `{ "email": "customer@example.com", "otp": "...", "newPassword": "newpassword123" }`. Trả về thành công và cập nhật mật khẩu trong cơ sở dữ liệu.
- **Kiểm tra giao diện frontend**:
  - Truy cập trang `/forgot-password`, nhập email và click gửi. Hệ thống phải chuyển hướng sang `/reset-password`.
  - Trên trang `/reset-password`, kiểm tra xem ô nhập OTP có hiển thị và có báo lỗi nếu bỏ trống hoặc nhập ít/nhiều hơn 6 số hay không.
  - Nhập thông tin và bấm xác nhận, hệ thống phải báo thành công và chuyển hướng về trang `/login`.
