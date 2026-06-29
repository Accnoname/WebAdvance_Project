# 📅 TUẦN 2 — Menu & Table Management

> **Thời gian**: Tuần 2  
> **Mục tiêu**: CRUD menu món ăn + Quản lý bàn + QR code

---

## 🎯 Mục Tiêu Cuối Tuần

- [ ] API Menu CRUD hoạt động đầy đủ (có upload ảnh)
- [ ] API Table CRUD + tạo QR code
- [ ] Trang Menu hiển thị đẹp với filter & search
- [ ] Trang quản lý Menu (CRUD) cho Quản lý
- [ ] Trang sơ đồ bàn (TablesPage) hiển thị đúng màu theo trạng thái
- [ ] Ảnh món ăn upload được và hiển thị đúng trên frontend

---

## 👨‍💻 Dev A — Backend

### Ngày 1-2: Menu Service & API
- [ ] Implement `menu.service.js` — hoàn thiện các functions:
  ```js
  const getAll = async (query) => {
    // filter theo category, search theo name, phân trang
  };
  const create = async (data, file) => {
    // nếu có file → lưu path, tạo menuItem
  };
  const update = async (id, data, file) => { ... };
  const remove = async (id) => {
    // xóa file ảnh local nếu có
  };
  const toggleAvailability = async (id) => { ... };
  ```
- [ ] Test upload ảnh với Multer (folder `uploads/menu/`)
- [ ] Đảm bảo `GET /uploads/filename.jpg` trả được ảnh

### Ngày 2-3: Menu Controller + Routes
- [ ] Hoàn thiện `menu.controller.js` (đã có skeleton)
- [ ] Hoàn thiện `menu.routes.js` với đúng middleware
- [ ] Test các routes:
  - `GET /api/v1/menu?category=chinh&page=1&limit=10`
  - `POST /api/v1/menu` (multipart/form-data có ảnh)
  - `PUT /api/v1/menu/:id`
  - `DELETE /api/v1/menu/:id`
  - `PATCH /api/v1/menu/:id/availability`

### Ngày 3-4: Table Service & API
- [ ] Implement `table.service.js`:
  ```js
  const create = async (data) => {
    // Tạo bàn → tạo QR code URL → lưu vào table
  };
  const getAll = async () => { ... };
  const updateStatus = async (id, status, orderId) => { ... };
  ```
- [ ] Dùng thư viện `qrcode` tạo QR code dạng `dataURL`
- [ ] Test `GET /api/v1/tables` trả danh sách bàn + trạng thái

### Ngày 4-5: Seed Data + Postman
- [ ] Tạo file `src/seeds/menu.seed.js` — seed 10-15 món mẫu
- [ ] Tạo file `src/seeds/table.seed.js` — seed 10 bàn mẫu
- [ ] Chạy seed để có data test
- [ ] Cập nhật Postman collection với menu + table endpoints

---

## 👩‍💻 Dev B — Frontend

### Ngày 1-2: MenuPage (Khách hàng xem)
- [ ] Implement `MenuPage.jsx`:
  - Grid cards hiển thị món ăn
  - Filter theo category (tabs: Khai Vị / Chính / Tráng Miệng / Nước)
  - Search theo tên món (input debounce 300ms)
  - Lazy loading hoặc phân trang
  - Badge "Hết món" nếu `isAvailable = false`
  - Nút "Thêm vào giỏ" gọi `cartStore.addItem()`
- [ ] Tạo `MenuCard.jsx` component

### Ngày 2-3: CartPage
- [ ] Implement `CartPage.jsx`:
  - Danh sách món trong giỏ
  - Tăng/giảm số lượng (useCart hook)
  - Xóa món khỏi giỏ
  - Ghi chú cho từng món
  - Hiển thị tổng tiền (formatCurrency)
  - Nút "Đặt món" → POST `/api/v1/orders`

### Ngày 3-4: MenuManagePage (Quản lý)
- [ ] Implement `MenuManagePage.jsx`:
  - Bảng danh sách món với cột: Ảnh, Tên, Danh mục, Giá, Trạng thái
  - Modal thêm/sửa món:
    - Form fields: name, description, category, price, prepareTime
    - Upload ảnh (input type="file" + preview)
    - Submit gọi `menuService.create()` / `menuService.update()`
  - Nút xóa có confirm dialog
  - Toggle bật/tắt isAvailable (Switch component)

### Ngày 4-5: TablesPage (Nhân viên)
- [ ] Implement `TablesPage.jsx`:
  - Grid bàn dạng card
  - Màu sắc theo trạng thái:
    - 🟢 `trong` → xanh lá
    - 🔴 `dang_phuc_vu` → đỏ
    - 🟡 `dat_truoc` → vàng
    - ⚫ `dong` → xám
  - Click vào bàn → xem chi tiết / đổi trạng thái
  - Hiển thị QR code khi click "Xem QR"

---

## 🔌 API Contract — Tuần 2

### GET `/api/v1/menu`
```
Query params:
  ?category=chinh       → filter theo danh mục
  ?search=phở           → tìm theo tên
  ?page=1&limit=12
  ?isAvailable=true

Response 200:
{
  "success": true,
  "message": "Danh sách menu",
  "data": [
    {
      "_id": "...",
      "name": "Phở Bò",
      "category": "chinh",
      "price": 65000,
      "image": "/uploads/menu/1234567890.jpg",
      "isAvailable": true,
      "prepareTime": 15
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 45, "totalPages": 4 }
}
```

### POST `/api/v1/menu` (multipart/form-data)
```
Headers: Authorization: Bearer <token> (quan_ly)
Body (form-data):
  name: "Phở Bò"
  description: "Phở bò truyền thống"
  category: "chinh"
  price: 65000
  prepareTime: 15
  image: [file]

Response 201:
{ "success": true, "message": "Thêm món thành công", "data": { MenuItem } }
```

### GET `/api/v1/tables`
```
Headers: Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "tableNumber": 1,
      "capacity": 4,
      "status": "trong",
      "qrCode": "data:image/png;base64,...",
      "currentOrder": null
    }
  ]
}
```

### PATCH `/api/v1/tables/:id/status`
```json
// Request
{ "status": "dang_phuc_vu" }

// Response
{ "success": true, "message": "Cập nhật trạng thái bàn", "data": { Table } }
```

---

## 📦 Shared Components Tuần 2

> Dev B tạo các component dùng chung để tuần sau tái sử dụng:

```jsx
// components/ui/Badge.jsx
// Props: status (string) → tự map màu theo STATUS_LABELS

// components/menu/MenuCard.jsx
// Props: item (MenuItem), onAddToCart, showAdminActions

// components/table/TableCard.jsx
// Props: table (Table), onClick, showQR
```

---

## ✅ Definition of Done

- [ ] Ảnh upload xong hiển thị được trên frontend
- [ ] Filter + search menu hoạt động
- [ ] Grid bàn cập nhật màu đúng theo status
- [ ] Modal thêm/sửa món đóng mở mượt mà
- [ ] Không còn dữ liệu mock cứng — tất cả từ API

---

## 🚨 Điểm Cần Lưu Ý

> **Dev A**: Đảm bảo `uploads/` được serve static. Test URL: `http://localhost:3000/uploads/menu/filename.jpg`

> **Dev B**: Khi hiển thị ảnh từ API, dùng path đầy đủ: `\`/uploads/menu/${item.image}\`` hoặc prefix với base URL

> **Đồng bộ ngày 3**: Confirm API response format trước khi Dev B tích hợp

---

## 📌 Branch & PR

```
Dev A: git checkout -b backend/week2-menu-table
Dev B: git checkout -b frontend/week2-menu-ui

# PR Title:
# [Week2] Backend - Menu & Table API + Upload ảnh
# [Week2] Frontend - MenuPage, CartPage, MenuManage, TablesPage
```
