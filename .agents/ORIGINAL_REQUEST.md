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
