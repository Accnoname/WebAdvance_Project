# 🔐 Danh Sách Tài Khoản Đăng Nhập

Danh sách tài khoản hiện có trong hệ thống theo từng vai trò (Role-Based Access Control).

---

## 1. 👑 Quản Lý (Manager)
- **Role:** `quan_ly`
- **Username / Email:** `admin@restaurant.com`
- **Password:** `Hieu1410@.A`
- **Vào trang:** `/manager` → Dashboard Quản Lý
- **Quyền hạn:** Toàn quyền — Dashboard, quản lý menu, bàn, nhân viên, báo cáo doanh thu, kiểm toán.

## 2. 👨‍🍳 Nhân Viên (Staff)
- **Role:** `nhan_vien`
- **Username / Email:** `staff@restaurant.com`
- **Password:** `123456`
- **Vào trang:** `/staff/kitchen` → Màn Hình Bếp
- **Quyền hạn:** Kiêm nhiệm Bếp + Phục vụ + Điều phối + Thu ngân tiền mặt.

## 3. 👤 Khách Hàng (Customer)
- **Role:** `khach_hang`
- **Username / Email:** `khach@gmail.com`
- **Password:** `123456`
- **Vào trang:** `/` → Landing Page → Menu → Đặt món
- **Quyền hạn:** Xem menu, thêm vào giỏ hàng, đặt món, xem đơn hàng của bản thân, thanh toán.

---

## 🔄 Luồng Chuyển Hướng Sau Đăng Nhập

| Role | Redirect về |
|------|-------------|
| `quan_ly` | `/manager` |
| `nhan_vien` | `/staff/kitchen` |
| `khach_hang` | `/` (Landing Page) |

---

## 💡 Lưu ý
- Đăng ký mới từ `/register` → mặc định được gán role `khach_hang`.
- Để tạo tài khoản `nhan_vien`, dùng chức năng "Tạo nhân viên" trong `/manager/staff`.
- Để đổi role thủ công: vào MongoDB Compass → collection `users` → sửa trường `role`.
- Mật khẩu `quan_ly` đã được đổi thành `Hieu1410@.A` — **không** dùng `123456` cho tài khoản này.
