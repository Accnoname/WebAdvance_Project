# 🍽️ Feature Spec — Restaurant Management System
## All-in-One Integrated F&B Platform

> Cập nhật: 29/06/2026
> Phân quyền: **3 Roles cố định** — `khach_hang` | `nhan_vien` | `quan_ly`

---

## 🏛️ Quyết Định Kiến Trúc (Architecture Decisions)

### 1. Roles — Giữ nguyên 3 roles, phân màn hình theo URL
```
khach_hang  →  Toàn bộ Customer Storefront
nhan_vien   →  Phân theo màn hình/URL:
                 /staff/kitchen   → Nhân viên BẾP (nấu ăn)
                 /staff/tables    → Nhân viên PHỤC VỤ (bưng bê, sơ đồ bàn)
                 /staff/orders    → Nhân viên ĐIỀU PHỐI / THU NGÂN
quan_ly     →  Toàn quyền /manager/*
```

### 2. Inventory — KHÔNG build kho tự động, thay bằng "Quick Lock"
- Mỗi `MenuItem` có field `isAvailable: Boolean`
- Quản lý: Toggle ON/OFF từ `/manager/menu`
- **Nhân viên bếp**: Tại `/staff/kitchen` có nút **"Khóa món"** → ẩn món trên màn hình khách

### 3. Smart Grouping — Có, nhưng linh hoạt (Opt-in)
- **Chế độ Ticket:** Hiển thị từng đơn riêng theo bàn (mặc định)
- **Chế độ Grouped:** Gộp cùng món nhiều bàn lại thành 1 dòng (Bếp làm một mẻ)

---

## 👤 ROLE 1: KHÁCH HÀNG

| # | Tính năng | Mô tả chi tiết | Priority |
|---|-----------|----------------|----------|
| K1 | **Landing Page** | Storytelling 4 sections, fade-in animation, parallax | ✅ Done |
| K2 | **Dynamic Menu** | Hiển thị món theo danh mục. | ✅ Done |
| K3 | **Giỏ Hàng (Cart)** | Thêm/bớt món, tính tổng tiền. | ✅ Done |
| K4 | **Đặt Đơn** | Chọn bàn (scan QR). | ✅ Done |
| K5 | **Real-time Tracking** | Thanh tiến trình: `Chờ → Đang chế biến → Sẵn sàng → Hoàn thành` | 🔥 P1 |
| K6 | **Thanh toán** | Yêu cầu thu tiền mặt / chuyển khoản thủ công. | ✅ Done |

---

## 👨‍🍳 ROLE 2: NHÂN VIÊN (3 Màn Hình)

### 2A. Màn Hình Bếp — `/staff/kitchen` (KDS)
| # | Tính năng | Mô tả chi tiết | Priority |
|---|-----------|----------------|----------|
| B1 | **KDS Aggregated View** | Gom nhóm món giống nhau. Màn hình siêu sáng. | ✅ Done |
| B2 | **1-touch Update** | `[NẤU TẤT CẢ]` (Vàng) → `[TRẢ ĐỦ PHẦN]` (Xanh Lá) | ✅ Done |
| B3 | **Ưu Tiên (Priority)**| Tự động highlight đỏ rực các món/đơn chờ lâu. | ✅ Done |
| B4 | **Khóa Món Nhanh** | Ẩn món trên màn hình khách (nếu hết nguyên liệu) | 🔥 P1 |

### 2B. Màn Hình Phục Vụ — `/staff/tables`
| # | Tính năng | Mô tả chi tiết | Priority |
|---|-----------|----------------|----------|
| P1 | **Sơ Đồ Bàn Trực Quan** | Màu Xanh / Vàng / Đỏ. Glassmorphism UI. | ✅ Done |
| P2 | **QR Gọi Món Nhanh** | Modal QR cực lớn giữa màn hình cho khách quét. | ✅ Done |
| P3 | **Mở Bàn / Gọi Món Hộ**| Nhân viên tự mở bàn và gọi món cho khách (Offline)| 🔥 P1 |

### 2C. Màn Hình Điều Phối / Thu Ngân — `/staff/orders`
| # | Tính năng | Mô tả chi tiết | Priority |
|---|-----------|----------------|----------|
| D1 | **Danh Sách Đơn** | Thiết kế Clean UI, dễ dàng đối chiếu mã đơn. | ✅ Done |
| D2 | **Cập Nhật Trạng Thái** | Đổi trạng thái `Mới` → `Đang xử lý` → `Hoàn thành` | ✅ Done |
| D3 | **Đa Dạng Thanh Toán** | Xử lý thanh toán Tiền mặt / Chuyển khoản thủ công. | ✅ Done |

---

## 👑 ROLE 3: QUẢN LÝ

| # | Tính năng | Mô tả chi tiết | Priority |
|---|-----------|----------------|----------|
| M1 | **Dashboard KPI** | Doanh thu, Số đơn, Bàn bận, Đơn chờ bếp. Trend (↑↓%) | 🔥 P1 |
| M2 | **Giám sát Real-time** | Danh sách đơn đang active + Sơ đồ bàn mini | 🔥 P1 |
| M3 | **Quản Lý Menu** | CRUD món, upload ảnh (Multer), toggle "Hết hàng" | 🔥 P1 |
| M4 | **Quản Lý Bàn** | Tạo/xóa bàn, sinh mã QR tự động | 🔥 P1 |
| M5 | **Quản Lý Nhân Viên** | Tạo tài khoản, reset password | 🔥 P1 |
| M6 | **Báo Cáo Doanh Thu** | Lọc theo ngày/tuần/tháng | 🔥 P1 |
| M7 | **Mã Giảm Giá** | Tạo mã discount (% hoặc tiền), giới hạn ngày, số lượng | 🔥 P1 |
