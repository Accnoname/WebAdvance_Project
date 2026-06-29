# 🔐 Danh Sách Tài Khoản Test (Role & Password)

Để thuận tiện cho việc demo chức năng phân quyền (Role-Based Access Control) khi thuyết trình, dưới đây là danh sách các tài khoản có sẵn theo từng Role trong hệ thống.

> **Mật khẩu chung cho tất cả các tài khoản test là:** `123456`

---

## 1. 👑 Quản Lý (Manager)
- **Role:** `quan_ly`
- **Email:** `admin@restaurant.com`
- **Password:** `123456`
- **Quyền hạn:** Truy cập toàn bộ hệ thống, xem báo cáo doanh thu, quản lý nhân viên, thêm bớt menu món ăn.

## 2. 👨‍🍳 Nhân Viên (Staff / Kitchen)
- **Role:** `nhan_vien`
- **Email:** `staff@restaurant.com`
- **Password:** `123456`
- **Quyền hạn:** Truy cập màn hình thu ngân, màn hình nhà bếp để xem món cần làm, cập nhật trạng thái đơn hàng (Đã làm xong, Đã phục vụ).

## 3. 👤 Khách Hàng (Customer)
- **Role:** `khach_hang`
- **Email:** `khach@gmail.com`
- **Password:** `123456`
- **Quyền hạn:** Xem menu, quét mã QR tại bàn để đặt món, xem lại lịch sử đơn hàng của bản thân, thanh toán.

---

## 💡 Lưu ý khi test:
- Khi bạn dùng tính năng **Đăng Ký** ở ngoài màn hình trang chủ (`/register`), hệ thống sẽ **mặc định gán Role là `khach_hang`** vì tính bảo mật.
- Để có tài khoản `quan_ly` hoặc `nhan_vien`, bạn có thể đổi trực tiếp cột `role` trong cơ sở dữ liệu MongoDB Compass, hoặc sử dụng tính năng "Tạo tài khoản nhân viên" trong Dashboard của Quản lý (sẽ làm ở Tuần 2).
