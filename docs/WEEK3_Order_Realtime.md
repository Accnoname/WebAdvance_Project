# 📅 TUẦN 3 — Order & Real-time (Socket.IO)

> **Thời gian**: Tuần 3  
> **Mục tiêu**: Hệ thống đặt món + Real-time với Socket.IO

---

## 🎯 Mục Tiêu Cuối Tuần

- [ ] Khách hàng đặt món → bếp nhận ngay lập tức (không cần refresh)
- [ ] Nhân viên cập nhật trạng thái món → khách thấy ngay
- [ ] Màn hình bếp (KitchenPage) hoạt động real-time
- [ ] Sơ đồ bàn cập nhật tự động khi có đơn mới
- [ ] Khách xem lịch sử đơn hàng với timeline live

---

## 👨‍💻 Dev A — Backend

### Ngày 1-2: Order Service
- [ ] Implement `order.service.js` — function `createOrder`:
  ```js
  const createOrder = async (orderData, user) => {
    // 1. Validate table tồn tại + đang trống
    // 2. Lấy price từ MenuItem (không tin client gửi lên)
    // 3. Tính totalAmount = sum(price * quantity)
    // 4. Tạo order trong DB
    // 5. Cập nhật table.status → 'dang_phuc_vu'
    // 6. Emit socket 'order:new' tới kitchen + staff
    // 7. Return order
  };
  ```
- [ ] Implement `updateStatus(orderId, status)`:
  - Nếu status = `hoan_thanh` → cập nhật table → `trong`
  - Emit `order:status-changed`
- [ ] Implement `updateItemStatus(orderId, itemId, status)`:
  - Cập nhật status từng item trong order
  - Emit `order:item-updated` tới room `table:{tableId}`

### Ngày 2-3: Order Controller + Routes
- [ ] Hoàn thiện `order.controller.js`:
  - `getAll` — filter theo status, table, date
  - `getById` — populate đầy đủ (table, items.menuItem, customer)
  - `create` — gọi OrderService.createOrder
  - `updateStatus` — gọi OrderService.updateStatus
  - `updateItemStatus` — gọi OrderService.updateItemStatus
  - `getMyOrders` — lọc theo `req.user._id`
- [ ] Hoàn thiện `order.routes.js`
- [ ] Test toàn bộ order flow

### Ngày 3-4: Socket.IO Setup
- [ ] Kiểm tra `config/socket.js` (join-kitchen, join-staff, join-table events)
- [ ] Kiểm tra `sockets/order.socket.js` — các emit helpers
- [ ] Tích hợp emit vào OrderService (dùng `getIO()`)
- [ ] Test bằng cách dùng 2 browser tab:
  - Tab 1: Join room `kitchen`
  - Tab 2: Tạo order → Tab 1 phải nhận được event

### Ngày 4-5: Test & Debug Real-time
- [ ] Test đầy đủ socket events với Socket.IO tester
- [ ] Đảm bảo khi đặt món: `table.status` → `dang_phuc_vu`
- [ ] Đảm bảo khi đơn hoàn thành: `table.status` → `trong`
- [ ] Cập nhật Postman collection

---

## 👩‍💻 Dev B — Frontend

### Ngày 1: Hook Socket.IO
- [ ] Hoàn thiện `useSocket.js` hook:
  ```js
  const useSocket = (room) => {
    // Kết nối socket với auth token
    // Tự động join room
    // Cleanup khi unmount
    return { socket, on, off, emit };
  };
  ```
- [ ] Test kết nối socket: log `socket.id` khi connect thành công

### Ngày 2: OrderPage (Khách đặt món)
- [ ] Implement `OrderPage.jsx` (từ giỏ hàng → xác nhận đặt):
  - Hiển thị lại tất cả món trong giỏ
  - Input số bàn / scan QR (tableId từ query param)
  - Ghi chú chung cho đơn
  - Nút "Xác nhận đặt món" → `POST /api/v1/orders`
  - Sau khi đặt: clear cart → chuyển sang `MyOrdersPage`

### Ngày 2-3: MyOrdersPage (Timeline real-time)
- [ ] Implement `MyOrdersPage.jsx`:
  - Gọi `GET /api/v1/orders/my-orders`
  - Mỗi đơn hàng: timeline dọc các món + status
  - Kết nối socket: `join-table:{tableId}`
  - Lắng nghe `order:item-updated` → cập nhật UI không cần refresh
  - Badge màu theo status: đỏ→đang chờ, vàng→đang nấu, xanh→xong

### Ngày 3-4: KitchenPage (Màn hình bếp real-time)
- [ ] Implement `KitchenPage.jsx`:
  - Join room `kitchen` khi mount
  - Lắng nghe `order:new` → thêm card đơn mới vào đầu
  - Mỗi card đơn: bàn số, danh sách món, thời gian đặt, đếm ngược
  - Nút "Bắt đầu nấu" → PATCH status → `dang_che_bien`
  - Nút "Hoàn thành" → PATCH status → `hoan_thanh`
  - Màu nền card: đỏ (mới) → vàng (đang nấu) → xanh (xong)

### Ngày 4-5: StaffOrdersPage + Real-time Tables
- [ ] Implement `StaffOrdersPage.jsx`:
  - Danh sách tất cả đơn, filter theo status
  - Inline update status từng đơn
- [ ] Cập nhật `TablesPage.jsx`:
  - Join room `staff` khi mount
  - Lắng nghe `table:status-changed` → cập nhật màu bàn realtime

---

## 🔌 API Contract — Tuần 3

### POST `/api/v1/orders`
```json
// Request (Auth: Bearer token)
{
  "tableId": "64abc...",
  "items": [
    { "menuItemId": "64def...", "quantity": 2, "note": "ít cay" },
    { "menuItemId": "64ghi...", "quantity": 1, "note": "" }
  ],
  "note": "Mang đũa thêm"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "...",
    "table": { "tableNumber": 3 },
    "items": [
      {
        "_id": "itemId1",
        "menuItem": { "name": "Phở Bò", "price": 65000 },
        "quantity": 2,
        "price": 65000,
        "status": "cho_xac_nhan"
      }
    ],
    "orderStatus": "moi",
    "totalAmount": 195000
  }
}
```

### PATCH `/api/v1/orders/:id/items/:itemId/status`
```json
// Request (Auth: nhan_vien / quan_ly)
{ "status": "dang_che_bien" }

// Response 200
{ "success": true, "message": "Cập nhật trạng thái món", "data": { Order } }

// Socket emit sau khi update:
// Event: "order:item-updated"
// Payload: { orderId, itemId, status, tableId }
```

### Socket Events (Tuần 3)

```js
// Dev B cần lắng nghe:
socket.on('order:new', (order) => { /* Thêm vào KitchenPage */ });
socket.on('order:item-updated', ({ orderId, itemId, status }) => { /* Cập nhật UI */ });
socket.on('order:status-changed', ({ orderId, status }) => { /* Cập nhật đơn */ });
socket.on('table:status-changed', ({ tableId, status }) => { /* Cập nhật bàn */ });

// Dev B cần emit:
socket.emit('join-kitchen');              // KitchenPage
socket.emit('join-staff');               // StaffDashboard, TablesPage
socket.emit('join-table', tableId);      // MyOrdersPage, OrderPage
```

---

## 📦 Shared Types — Trạng Thái

```js
// Dùng từ constants.js
ORDER_ITEM_STATUS:
  cho_xac_nhan  → Badge đỏ   "Chờ xác nhận"
  dang_che_bien → Badge vàng "Đang nấu"
  hoan_thanh    → Badge xanh "Hoàn thành"
  huy           → Badge xám  "Đã hủy"
```

---

## ✅ Definition of Done

- [ ] Đặt món → bếp nhận ngay không cần refresh
- [ ] Cập nhật status món → khách thấy trên MyOrdersPage
- [ ] KitchenPage: đơn mới hiện ở đầu, có thể đổi status
- [ ] Sơ đồ bàn: màu thay đổi realtime khi có đơn mới

---

## 🚨 Điểm Cần Lưu Ý

> **Dev A**: `getIO()` phải được gọi **sau** khi `initSocket()` trong server.js

> **Dev B**: Socket phải disconnect trong `useEffect` cleanup để tránh memory leak

> **Sync ngày 2**: Confirm socket event payload format trước khi Dev B lắng nghe

---

## 📌 Branch & PR

```
Dev A: git checkout -b backend/week3-order-socket
Dev B: git checkout -b frontend/week3-order-realtime

# PR Title:
# [Week3] Backend - Order API + Socket.IO events
# [Week3] Frontend - KitchenPage, OrderPage, MyOrdersPage real-time
```
