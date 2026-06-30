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
| **Email** | `admin@gmail.com` |
| **Password** | `123456` |
| **Role** | `quan_ly` |

- **Vào trang:** `/manager` → Dashboard Quản Lý
- **Quyền hạn:** Toàn quyền — Dashboard, Menu, Bàn, Nhân viên, Báo cáo, Mã giảm giá.

---

## 2. 👨‍🍳 Nhân Viên (Staff)

| Trường | Giá trị |
|--------|---------|
| **Email** | `staff@gmail.com` |
| **Password** | `123456` |
| **Role** | `nhan_vien` |

- **Vào trang:** `/staff/kitchen` → Màn Hình Bếp
- **Các màn hình khác:** `/staff/tables` (Sơ đồ bàn), `/staff/orders` (Điều phối & Thu ngân)

---

## 3. 👤 Khách Hàng (Customer)

| Trường | Giá trị |
|--------|---------|
| **Email** | `khach@gmail.com` |
| **Password** | `123456` |
| **Role** | `khach_hang` |

- **Vào trang:** `/` → Landing Page → Menu → Đặt món

---

## 🔄 Redirect Sau Đăng Nhập

| Role | Redirect về |
|------|-------------|
| `quan_ly` | `/manager` |
| `nhan_vien` | `/staff/kitchen` |
| `khach_hang` | `/` |

---

## 💡 Lưu ý

- Đăng ký mới từ `/register` → mặc định role `khach_hang`.
- Để tạo tài khoản `nhan_vien` mới: vào `/manager/staff` → Tạo nhân viên.
- Để đổi role thủ công: MongoDB Compass → collection `users` → sửa trường `role`.
