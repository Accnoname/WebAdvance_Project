# Original User Request

## 2026-07-06T12:50:37Z

Xây dựng **Hệ thống Mã Giảm Giá (Voucher/Coupon)** hoàn chỉnh cho Restaurant Management System. Tính năng cho phép Quản lý tạo và phân phối mã giảm giá, đồng thời Khách hàng có thể nhập mã khi thanh toán để được giảm giá.

Working directory: `d:\Web Nhà Hàng`
Integrity mode: development

---

## Requirements

### R1. Backend — CRUD Mã Giảm Giá
Quản lý (`quan_ly`) có thể tạo, sửa, xóa (ẩn), và xem danh sách mã giảm giá thông qua RESTful API. Mỗi voucher có: mã code (duy nhất), loại giảm giá (phần trăm hoặc số tiền cố định), giá trị giảm, đơn hàng tối thiểu, ngày hết hạn, số lần sử dụng tối đa và số lần đã dùng. API phải đảm bảo các quy tắc nghiệp vụ: không áp dụng voucher hết hạn, đã dùng hết lượt, hoặc đơn hàng chưa đạt ngưỡng tối thiểu.

### R2. Backend — Áp Dụng Voucher vào Đơn Hàng
Khách hàng hoặc nhân viên có thể nhập mã giảm giá khi tạo đơn hàng hoặc khi thanh toán. Server phải xác thực mã, tính toán số tiền giảm chính xác, lưu snapshot `discountAmount` and `voucherCode` vào Order, đồng thời tăng `usedCount` của voucher đó.

### R3. Frontend — Trang Quản Lý Voucher cho Manager
Tạo trang `/manager/vouchers` hiển thị danh sách voucher dạng bảng, có nút Tạo Mới mở modal nhập liệu, nút ẩn/xóa voucher. Giao diện phải theo đúng design system hiện tại của dự án (tone màu sáng, font Syne/DM Sans, consistent với `DashboardPage.jsx` và `ReportPage.jsx`).

### R4. Frontend — Tích Hợp vào Luồng Thanh Toán
Màn hình POS của nhân viên (`POSPage.jsx`) cần có ô nhập mã voucher. Khi nhập và xác nhận, hệ thống gọi API kiểm tra mã và hiển thị số tiền được giảm trực tiếp trên tổng hóa đơn trước khi hoàn tất thanh toán.

---

## Acceptance Criteria

### Backend API
- [ ] API `POST /api/v1/vouchers` tạo voucher mới thành công (role `quan_ly`)
- [ ] API `GET /api/v1/vouchers/validate/:code` trả về thông tin voucher hợp lệ hoặc lỗi rõ ràng (mã sai, hết hạn, đã dùng hết)
- [ ] Sau khi đơn hàng dùng voucher được tạo, `usedCount` của voucher tăng lên 1
- [ ] Đơn hàng lưu đúng `discountAmount` và `finalAmount` (tổng sau giảm)

### Frontend Manager
- [ ] Trang `/manager/vouchers` render danh sách không lỗi, hiển thị cột: Mã, Giá trị, Hết hạn, Đã dùng/Tổng lượt
- [ ] Modal tạo voucher mới hoạt động, form có validation (ngày hết hạn không được ở quá khứ, giá trị > 0)

### Frontend POS Integration  
- [ ] Ô nhập voucher trên POSPage hiển thị và có thể nhập mã
- [ ] Nhập mã hợp lệ → Tổng tiền cập nhật hiển thị số tiền được giảm
- [ ] Nhập mã không hợp lệ → Hiển thị toast thông báo lỗi rõ ràng bằng `react-hot-toast`

### Convention & Code Quality
- [ ] Backend theo đúng pattern MVC + Service Layer + Repository (như các file hiện tại trong dự án)
- [ ] Tất cả function dùng arrow function, không có `function` keyword, có `try/catch` đầy đủ
- [ ] Không có `console.log` debug còn sót
- [ ] Frontend không có lỗi khi chạy `npm run build` trong thư mục `frontend/`

## 2026-07-09T04:57:05Z

Nghiên cứu, đánh giá và đề xuất các giải pháp tối ưu hóa luồng trải nghiệm người dùng (UX/UI) và logic xử lý luồng dữ liệu (Backend + Frontend) cho quy trình tương tác giữa Giỏ Hàng và Đặt Bàn.

Working directory: d:\Web Nhà Hàng
Integrity mode: demo

## Requirements

### R1. Phân tích hiện trạng luồng dữ liệu & UI
- Đọc mã nguồn của các file liên quan (Frontend: `CartPage.jsx`, `ReservationPage.jsx`; Backend: `reservation.service.js` và logic khởi tạo Order).
- Phân tích chi tiết quy trình từ lúc khách hàng thao tác trên giỏ hàng, chuyển sang đặt bàn, cho đến khi hoàn thành đơn hẹn và dữ liệu được lưu xuống cơ sở dữ liệu.

### R2. Phát hiện vấn đề & Bottlenecks
- Xác định các điểm có khả năng gây lỗi (edge cases), thao tác rườm rà, hoặc xử lý chưa tối ưu về mặt hiệu năng.
- Phân tích tính đồng bộ dữ liệu (trạng thái giỏ hàng trước và sau khi đặt bàn).

### R3. Đề xuất giải pháp và Code mẫu
- Cung cấp giải pháp tối ưu hóa cho cả luồng trải nghiệm người dùng và mã nguồn hệ thống.
- Cung cấp các đoạn code mẫu (nếu cần refactor) để minh họa rõ cách triển khai đề xuất.

## Acceptance Criteria

### Đánh giá chất lượng phân tích
- [ ] Báo cáo phân tích có trích dẫn trực tiếp từ mã nguồn hiện tại của dự án để làm bằng chứng cho các vấn đề được nêu ra.
- [ ] Phân tích bao phủ được cả 2 khía cạnh: Trải nghiệm trên Frontend và tính nhất quán dữ liệu ở Backend.

### Đánh giá giải pháp đề xuất
- [ ] Mỗi đề xuất tối ưu đều đi kèm với lời giải thích về lợi ích mang lại (Ví dụ: Giảm bớt số lần click chuột, ngăn ngừa lỗi mất dữ liệu khi chuyển trang).
- [ ] Đề xuất phải thực tế, phù hợp với kiến trúc React và Node.js/Express hiện đang sử dụng, có thể áp dụng trực tiếp mà không cần cài đặt thêm framework phức tạp.

## 2026-07-09T05:21:05Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Sửa lỗi bảo mật trong luồng Quên mật khẩu (hiện đang rò rỉ token và bỏ qua bước xác thực mã OTP) và cập nhật luồng xác thực (Authentication) để đảm bảo hệ thống hoạt động đúng chuẩn và an toàn.

Working directory: d:\Web Nhà Hàng
Integrity mode: demo

## Requirements

### R1. Sửa lỗi bảo mật Backend (`auth.service.js` & `auth.controller.js`)
- Hàm `forgotPassword`: Chỉ lưu và gửi mã OTP (không được tạo hay trả về `resetToken` cho client). Mã OTP được lưu trực tiếp vào trường `resetPasswordToken` trong User model.
- Hàm `resetPassword`: Đổi tham số nhận vào thành `(email, otp, newPassword)`. So sánh OTP người dùng nhập với `resetPasswordToken` trong DB, nếu khớp và còn hạn thì cho phép đổi mật khẩu.

### R2. Cập nhật luồng Frontend (Ưu tiên tốc độ)
- Cập nhật trang `ForgotPasswordPage.jsx`: Xóa việc truyền `resetToken`, chỉ chuyển sang trang Đặt lại mật khẩu với dữ liệu `email` và hiển thị `otp` (chỉ dùng cho chế độ test).
- Cập nhật trang `ResetPasswordPage.jsx`: Thêm input field để người dùng bắt buộc nhập mã OTP 6 số. Submit `{ email, otp, newPassword }` lên server.

## Acceptance Criteria

### Đánh giá chất lượng và kiểm chứng (Agent-as-judge)
- [ ] Backend không còn trả về `resetToken` trong API `/auth/forgot-password`.
- [ ] API `/auth/reset-password` yêu cầu đủ 3 tham số `{ email, otp, newPassword }` và từ chối nếu sai OTP.
- [ ] Form trên Frontend chạy mượt mà, gọi API thành công theo luồng mới mà không báo lỗi cú pháp hay thiếu component.

## 2026-07-09T15:50:38Z

# Teamwork Project Prompt — Draft

Optimize the voucher application and payment workflow in both Frontend and Backend. Ensure the UI provides a seamless experience for applying vouchers in the cart, and the backend robustly calculates final amounts and prevents race conditions (e.g., double voucher usage) during checkout (including VNPay).

Working directory: d:\Web Nhà Hàng
Integrity mode: benchmark

## Requirements

### R1. Frontend UI/UX Optimization
Enhance the cart and checkout experience (`CartPage`, `PaymentPage`) to clearly display the voucher input, the applied discount amount, and the exact final amount before the user confirms payment (whether by cash or VNPay).

### R2. Backend Logic Robustness
Review and fix the payment and voucher logic to ensure the `finalAmount` is correctly persisted and passed to the VNPay URL generator. Implement safeguards (e.g., database locks, atomic operations) to prevent race conditions where a single voucher's `usedCount` might be incremented multiple times if concurrent payment callbacks occur.

## Acceptance Criteria

### Frontend Verification
- [ ] The Cart UI allows entering a voucher, and immediately displays the discounted amount vs the original amount.
- [ ] The Payment page clearly reflects the final discounted amount when rendering the VNPay payment button.

### Backend & Race Condition Verification
- [ ] Automated or manual concurrent tests (e.g., using `Promise.all` with multiple simultaneous IPN callbacks) must prove that the voucher `usedCount` is only incremented exactly once per successful order payment.
- [ ] The VNPay signature calculation uses the correct `finalAmount` (post-discount) and validates successfully upon return.
