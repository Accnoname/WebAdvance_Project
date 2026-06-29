# 🗺️ Kế Hoạch Phát Triển — Restaurant Management System

> Cập nhật: 29/06/2026  
> Stack: Node.js + Express + MongoDB | React 18 + Vite + Tailwind  
> Phân quyền: `khach_hang` | `nhan_vien` | `quan_ly`

---

## ✅ Đã Hoàn Thành

### 🔐 Auth & Nền Tảng
| Hạng mục | File liên quan | Ghi chú |
|---|---|---|
| Khởi tạo backend (Express + MongoDB) | `backend/src/server.js`, `backend/src/config/db.js` | ✅ |
| Khởi tạo frontend (React + Vite + Tailwind) | `frontend/vite.config.js`, `tailwind.config.js` | ✅ |
| Mongoose Schema 5 collections | `backend/src/models/*.model.js` | User, MenuItem, Table, Order, Payment |
| API đăng ký / đăng nhập JWT | `backend/src/routes/auth.routes.js` | ✅ |
| Middleware phân quyền 3 role | `backend/src/middlewares/auth.middleware.js` | `authenticate` + `authorizeRole` HOF |
| Tài khoản `quan_ly` trong DB | `docs/TEST_ACCOUNTS.md` | admin@restaurant.com / Hieu1410@.A |
| Zustand store | `frontend/src/store/authStore.js`, `cartStore.js` | ✅ |
| LoginPage + RegisterPage | `frontend/src/pages/auth/` | ✅ |

### 🎨 Kiến Trúc Frontend (3 Personas)
| Hạng mục | File liên quan | Ghi chú |
|---|---|---|
| CustomerLayout (Dark Premium) | `frontend/src/components/layout/CustomerLayout.jsx` | Nền `#0f0a05`, sticky navbar transparent |
| StaffLayout (Dark High-Contrast) | `frontend/src/components/layout/StaffLayout.jsx` | Nền `#0d1117`, nav tab theo route |
| ManagerLayout (Executive Sidebar) | `frontend/src/components/layout/ManagerLayout.jsx` | Slate sidebar, responsive |
| Router 3 layout | `frontend/src/router/index.jsx` | Guard theo role, redirect đúng trang |
| Navbar Dark Premium | `frontend/src/components/layout/Navbar.jsx` | Scroll-aware, role-aware |
| Hook `useInView` | `frontend/src/hooks/useInView.js` | Intersection Observer, trigger 1 lần |

### 🏠 Landing Page (Customer Storefront)
| Section | Mô tả | File |
|---|---|---|
| Hero | Fullscreen parallax bg, slogan, CTA button | `LandingPage.jsx` — Section 1 |
| Our Story | Ảnh + text fade-in-up, số liệu 35 năm | `LandingPage.jsx` — Section 2 |
| Signature Menu | 3 món nổi bật, hover reveal + giá | `LandingPage.jsx` — Section 3 |
| Social Proof + Footer | Quote khách hàng, địa chỉ, giờ mở cửa | `LandingPage.jsx` — Section 4 |

---

## 🔄 Đang Cần Làm

### 📋 Backend APIs (Ưu tiên cao)

#### Menu API
```
GET    /api/v1/menu               — danh sách (filter, search, phân trang)
POST   /api/v1/menu               — tạo món (multipart/form-data, ảnh Multer)
PUT    /api/v1/menu/:id           — cập nhật món
DELETE /api/v1/menu/:id           — xóa món
PATCH  /api/v1/menu/:id/availability — bật/tắt món
```
- File cần làm: `menu.service.js`, `menu.controller.js`, `menu.routes.js`
- Serve ảnh static: `GET /uploads/menu/:filename`

#### Table API
```
GET    /api/v1/tables             — danh sách bàn + trạng thái
POST   /api/v1/tables             — tạo bàn + sinh QR code
PATCH  /api/v1/tables/:id/status  — cập nhật trạng thái bàn
DELETE /api/v1/tables/:id         — xóa bàn
```
- File cần làm: `table.service.js`, `table.controller.js`, `table.routes.js`
- Dùng thư viện `qrcode` để sinh QR dạng dataURL

#### Order API
```
POST   /api/v1/orders             — tạo đơn hàng mới
GET    /api/v1/orders             — danh sách đơn (lọc theo bàn, trạng thái)
GET    /api/v1/orders/:id         — chi tiết đơn
PATCH  /api/v1/orders/:id/items/:itemId  — cập nhật trạng thái từng món
PATCH  /api/v1/orders/:id/status  — cập nhật trạng thái tổng đơn
```
- File cần làm: `order.service.js`, `order.controller.js`, `order.routes.js`
- Snapshot `price` từ MenuItem khi tạo đơn (KHÔNG ref giá live)
- Emit Socket.IO `order:new` sau khi lưu DB thành công

#### Payment API
```
POST   /api/v1/payments/vnpay     — tạo URL thanh toán VNPay
GET    /api/v1/payments/vnpay/callback — xử lý callback từ VNPay
POST   /api/v1/payments/cash      — ghi nhận thanh toán tiền mặt
GET    /api/v1/payments/:orderId  — trạng thái thanh toán đơn
```
- File cần làm: `payment.service.js`, `payment.controller.js`, `payment.routes.js`
- LUÔN verify VNPay signature trước khi xử lý callback

#### Socket.IO Events
```
order:new              — emit khi có đơn mới (→ room: 'kitchen')
order:item-updated     — emit khi trạng thái món thay đổi
order:status-changed   — emit khi trạng thái tổng đơn thay đổi
table:status-changed   — emit khi trạng thái bàn thay đổi
payment:success        — emit khi thanh toán thành công (→ room: 'staff')
```

---

### 🖥️ Frontend — Khách Hàng

| Trang | Việc cần làm | File |
|---|---|---|
| MenuPage | Cập nhật UI Dark Premium, gọi API thật, debounce search | `pages/customer/MenuPage.jsx` |
| CartPage | UI Dark Premium, gọi `POST /api/v1/orders`, xử lý lỗi | `pages/customer/CartPage.jsx` |
| MyOrdersPage | Danh sách đơn, Socket.IO listener cập nhật real-time | `pages/customer/MyOrdersPage.jsx` |
| PaymentPage | Hiển thị QR VNPay, polling trạng thái, xử lý callback | `pages/customer/PaymentPage.jsx` |

---

### 🧑‍🍳 Frontend — Nhân Viên

| Trang | Việc cần làm | File |
|---|---|---|
| KitchenPage | Cards theo trạng thái (Đỏ→Vàng→Xanh), nút "Đang nấu"/"Xong", Socket.IO live | `pages/staff/KitchenPage.jsx` |
| TablesPage | Grid bàn màu theo trạng thái, click xem đơn, đổi trạng thái bàn | `pages/staff/TablesPage.jsx` |
| StaffOrdersPage | Điều phối đơn, xác nhận giao món, ghi nhận thu tiền mặt | `pages/staff/StaffOrdersPage.jsx` |

---

### 📊 Frontend — Quản Lý

| Trang | Việc cần làm | File |
|---|---|---|
| DashboardPage | KPI cards (doanh thu hôm nay, đơn mới, bàn trống), biểu đồ mini | `pages/manager/DashboardPage.jsx` |
| MenuManagePage | Bảng danh sách + Modal thêm/sửa + Upload ảnh + Toggle isAvailable | `pages/manager/MenuManagePage.jsx` |
| TableManagePage | Grid bàn + thêm/xóa bàn + Xem QR code + In QR | `pages/manager/TableManagePage.jsx` |
| StaffManagePage | Danh sách nhân viên + Tạo tài khoản `nhan_vien` | `pages/manager/StaffManagePage.jsx` |
| ReportPage | Báo cáo doanh thu theo ngày/tháng, biểu đồ bar/line | `pages/manager/ReportPage.jsx` |

---

## 🧪 Tích Hợp & Kiểm Thử

- `[ ]` Seed data: 12 món ăn mẫu + 10 bàn mẫu
- `[ ]` Tạo tài khoản `nhan_vien` qua `/manager/staff`
- `[ ]` End-to-end flow:
  1. Khách scan QR bàn → vào `/menu?table=3`
  2. Thêm món → Đặt hàng → Tạo đơn trong DB
  3. Bếp nhận đơn qua Socket.IO → cập nhật từng món
  4. Phục vụ giao món → đổi trạng thái bàn
  5. Khách thanh toán VNPay hoặc tiền mặt
  6. Dashboard cập nhật doanh thu

---

## 📁 Cấu Trúc Thư Mục Hiện Tại

```
d:\Web Nhà Hàng\
├── backend/
│   └── src/
│       ├── config/         db.js, socket.js
│       ├── models/         User, MenuItem, Table, Order, Payment
│       ├── middlewares/    auth, error, validate, upload
│       ├── utils/          response, jwt, hash, vnpay, pagination
│       ├── repositories/   ← cần implement
│       ├── services/       ← cần implement
│       ├── controllers/    ← skeleton có, cần hoàn thiện
│       └── routes/         ← skeleton có, cần hoàn thiện
│
├── frontend/
│   └── src/
│       ├── components/layout/  CustomerLayout, StaffLayout, ManagerLayout, Navbar
│       ├── hooks/              useAuth.js, useInView.js ✅
│       ├── pages/
│       │   ├── auth/           LoginPage ✅, RegisterPage ✅
│       │   ├── customer/       LandingPage ✅, MenuPage, CartPage, MyOrders, Payment
│       │   ├── staff/          KitchenPage, TablesPage, StaffOrdersPage
│       │   └── manager/        Dashboard, MenuManage, TableManage, StaffManage, Report
│       ├── router/             index.jsx ✅
│       └── store/              authStore ✅, cartStore ✅
│
└── docs/
    ├── PLAN.md             ← file này
    ├── TEST_ACCOUNTS.md    ← tài khoản đăng nhập
    └── TEAM_WORKFLOW.md    ← quy trình làm việc nhóm
```

---

## 🔑 API Contract Chuẩn (Response Format)

```json
// Thành công
{ "success": true, "statusCode": 200, "message": "Mô tả", "data": {} }

// Có phân trang
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 } }

// Lỗi
{ "success": false, "statusCode": 400, "message": "Mô tả lỗi", "errors": [] }
```
