# 🔐 Danh Sách Tài Khoản Đăng Nhập (Test Accounts)

> **Cập nhật: 30/06/2026**  
> Để tạo lại toàn bộ tài khoản trong DB, chạy lệnh:  
> ```bash
> cd backend && node src/seeds/seed.js
> ```
> ⚠️ Lệnh này sẽ **xóa toàn bộ** User, Table, MenuItem hiện tại và tạo lại từ đầu.

---

## 1. 👑 Quản Lý (Manager)

| Trường | Giá trị |
|--------|---------|
| **Email** | `admin@restaurant.com` |
| **Password** | `Hieu1410@.A` |
| **Role** | `quan_ly` |
| **Tên** | Nguyễn Văn Admin |
| **SĐT** | 0901234567 |

- **Vào trang:** `/manager` → Dashboard Quản Lý
- **Quyền hạn:** Toàn quyền — Dashboard, Menu, Bàn, Nhân viên, Báo cáo, Kiểm toán, Mã giảm giá.

---

## 2. 👨‍🍳 Nhân Viên (Staff)

| Trường | Giá trị |
|--------|---------|
| **Email** | `staff@restaurant.com` |
| **Password** | `Staff@123` |
| **Role** | `nhan_vien` |
| **Tên** | Trần Thị Nhân Viên |
| **SĐT** | 0909876543 |

- **Vào trang:** `/staff/kitchen` → Màn Hình Bếp (mặc định)
- **Các màn hình khác:** `/staff/tables` (Sơ đồ bàn), `/staff/orders` (Điều phối & Thu ngân)
- **Quyền hạn:** Kiêm nhiệm Bếp + Phục vụ + Điều phối + Thu ngân tiền mặt.

---

## 3. 👤 Khách Hàng (Customer)

| Trường | Giá trị |
|--------|---------|
| **Email** | `khach@gmail.com` |
| **Password** | `Khach@123` |
| **Role** | `khach_hang` |
| **Tên** | Lê Văn Khách |
| **SĐT** | 0912345678 |

- **Vào trang:** `/` → Landing Page → Menu → Đặt món
- **Quyền hạn:** Xem menu, giỏ hàng, đặt món, theo dõi đơn real-time, thanh toán (VNPay / tiền mặt).

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
- Để tạo tài khoản `nhan_vien`, dùng chức năng **"Tạo nhân viên"** trong `/manager/staff`.
- Để đổi role thủ công: vào MongoDB Compass → collection `users` → sửa trường `role`.
- Password mới của nhân viên test đã đổi từ `123456` thành `Staff@123` (đủ mạnh hơn).
