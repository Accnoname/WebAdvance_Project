# 🍽️ Restaurant Management System — Full-Stack Implementation Plan

> **Stack**: Express.js + MongoDB + React.js + Vite + Tailwind CSS | **Monorepo**  
> **Ngày tạo**: 29/06/2026  
> **Tác giả**: Antigravity AI

---

## Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────┐
│                    MONOREPO ROOT                         │
│  restaurant-management/                                  │
│  ├── backend/    (Express API + Socket.IO)               │
│  └── frontend/   (React + Vite + Tailwind)               │
└─────────────────────────────────────────────────────────┘

                        REQUEST FLOW

[Browser/Mobile]
      │  HTTP/WS
      ▼
[React + Vite :5173]  ──proxy──►  [Express API :3000]
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                           MongoDB   Socket.IO   VNPay API
                          (Database) (Real-time) (Payment)
```

---

## 📁 Cấu Trúc Thư Mục Monorepo

```
restaurant-management/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # Mongoose connect
│   │   │   ├── env.js              # dotenv config
│   │   │   └── socket.js           # Socket.IO setup
│   │   │
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── MenuItem.model.js
│   │   │   ├── Order.model.js
│   │   │   ├── Table.model.js
│   │   │   └── Payment.model.js
│   │   │
│   │   ├── repositories/           # Data Access Layer
│   │   │   ├── base.repository.js  # Generic CRUD (tái sử dụng)
│   │   │   ├── user.repository.js
│   │   │   ├── menuItem.repository.js
│   │   │   ├── order.repository.js
│   │   │   ├── table.repository.js
│   │   │   └── payment.repository.js
│   │   │
│   │   ├── services/               # Business Logic
│   │   │   ├── auth.service.js
│   │   │   ├── menu.service.js
│   │   │   ├── order.service.js
│   │   │   ├── table.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── vnpay.service.js    # VNPay integration
│   │   │   └── report.service.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── menu.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── table.controller.js
│   │   │   ├── payment.controller.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js            # Root: gộp + prefix /api/v1
│   │   │   ├── auth.routes.js
│   │   │   ├── menu.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── table.routes.js
│   │   │   ├── payment.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js   # verifyToken, authorizeRole (HOF)
│   │   │   ├── error.middleware.js  # Global error handler
│   │   │   ├── validate.middleware.js
│   │   │   └── upload.middleware.js # Multer — lưu local /uploads/
│   │   │
│   │   ├── utils/
│   │   │   ├── response.util.js    # sendSuccess, sendError chuẩn hóa
│   │   │   ├── jwt.util.js         # generateToken, verifyToken (arrow fn)
│   │   │   ├── hash.util.js        # hashPassword, comparePassword
│   │   │   ├── vnpay.util.js       # Tạo URL + verify signature VNPay
│   │   │   └── pagination.util.js
│   │   │
│   │   └── sockets/
│   │       ├── order.socket.js     # Real-time order events
│   │       └── table.socket.js     # Real-time table events
│   │
│   ├── uploads/                    # Ảnh món ăn lưu local
│   │   └── menu/
│   ├── app.js
│   ├── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │
│   │   ├── components/             # Reusable Components
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── PrivateRoute.jsx
│   │   │   ├── menu/
│   │   │   │   ├── MenuCard.jsx
│   │   │   │   └── MenuFilter.jsx
│   │   │   ├── order/
│   │   │   │   ├── OrderCard.jsx
│   │   │   │   ├── OrderItemBadge.jsx
│   │   │   │   └── OrderTimeline.jsx
│   │   │   └── table/
│   │   │       ├── TableCard.jsx
│   │   │       └── TableStatusBadge.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   │
│   │   │   ├── customer/
│   │   │   │   ├── MenuPage.jsx
│   │   │   │   ├── CartPage.jsx
│   │   │   │   ├── OrderPage.jsx
│   │   │   │   ├── MyOrdersPage.jsx
│   │   │   │   └── PaymentPage.jsx
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── TablesPage.jsx
│   │   │   │   ├── OrdersPage.jsx
│   │   │   │   ├── KitchenPage.jsx
│   │   │   │   └── PaymentProcessPage.jsx
│   │   │   │
│   │   │   └── manager/
│   │   │       ├── DashboardPage.jsx
│   │   │       ├── MenuManagePage.jsx
│   │   │       ├── TableManagePage.jsx
│   │   │       ├── StaffManagePage.jsx
│   │   │       ├── OrdersPage.jsx
│   │   │       └── ReportPage.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   ├── useCart.js
│   │   │   └── usePagination.js
│   │   │
│   │   ├── services/               # API call functions
│   │   │   ├── api.js              # Axios instance + interceptors
│   │   │   ├── auth.service.js
│   │   │   ├── menu.service.js
│   │   │   ├── order.service.js
│   │   │   ├── table.service.js
│   │   │   └── payment.service.js
│   │   │
│   │   ├── store/                  # Zustand
│   │   │   ├── authStore.js
│   │   │   ├── cartStore.js
│   │   │   └── notificationStore.js
│   │   │
│   │   ├── utils/
│   │   │   ├── formatCurrency.js
│   │   │   ├── formatDate.js
│   │   │   └── constants.js
│   │   │
│   │   ├── router/
│   │   │   └── index.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── package.json                    # Root scripts (concurrently)
```

---

## 🗄️ Database Schema (MongoDB + Mongoose)

### 👤 User
```js
{
  name: String,
  email: String,       // unique
  phone: String,
  password: String,    // bcrypt hash
  role: {
    type: String,
    enum: ['quan_ly', 'nhan_vien', 'khach_hang'],
    default: 'khach_hang'
  },
  avatar: String,
  isActive: { type: Boolean, default: true },
  createdAt, updatedAt   // timestamps: true
}
```

### 🍜 MenuItem
```js
{
  name: String,
  description: String,
  category: {
    type: String,
    enum: ['khai_vi', 'chinh', 'trang_mieng', 'nuoc']
  },
  price: Number,
  image: String,       // path: '/uploads/menu/filename.jpg'
  isAvailable: { type: Boolean, default: true },
  prepareTime: Number, // phút
  createdBy: { type: ObjectId, ref: 'User' }
}
```

### 🪑 Table
```js
{
  tableNumber: { type: Number, unique: true },
  capacity: Number,
  status: {
    type: String,
    enum: ['trong', 'dang_phuc_vu', 'dat_truoc', 'dong'],
    default: 'trong'
  },
  currentOrder: { type: ObjectId, ref: 'Order' },
  qrCode: String       // URL hoặc base64 QR
}
```

### 📋 Order
```js
{
  table: { type: ObjectId, ref: 'Table' },
  customer: { type: ObjectId, ref: 'User' },
  items: [{
    menuItem: { type: ObjectId, ref: 'MenuItem' },
    quantity: Number,
    price: Number,     // snapshot giá lúc đặt
    note: String,
    status: {
      type: String,
      enum: ['cho_xac_nhan', 'dang_che_bien', 'hoan_thanh', 'huy'],
      default: 'cho_xac_nhan'
    }
  }],
  orderStatus: {
    type: String,
    enum: ['moi', 'dang_xu_ly', 'hoan_thanh', 'da_huy'],
    default: 'moi'
  },
  totalAmount: Number,
  note: String,
  orderedBy: { type: ObjectId, ref: 'User' }
}
```

### 💳 Payment
```js
{
  order: { type: ObjectId, ref: 'Order' },
  amount: Number,
  method: {
    type: String,
    enum: ['tien_mat', 'chuyen_khoan', 'vnpay']
  },
  status: {
    type: String,
    enum: ['cho_thanh_toan', 'da_thanh_toan', 'that_bai', 'hoan_tien'],
    default: 'cho_thanh_toan'
  },
  vnpayTransactionId: String,
  vnpayResponseCode: String,
  paidAt: Date,
  processedBy: { type: ObjectId, ref: 'User' }
}
```

---

## 🔌 API Endpoints

### 🔐 Auth — `/api/v1/auth`

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| POST | `/register` | Public | Đăng ký khách hàng |
| POST | `/login` | Public | Đăng nhập → trả JWT |
| POST | `/logout` | Auth | Đăng xuất |
| GET | `/me` | Auth | Xem profile |
| PUT | `/me` | Auth | Cập nhật profile |
| POST | `/create-staff` | Quản lý | Tạo tài khoản nhân viên |

### 🍜 Menu — `/api/v1/menu`

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/` | Public | Danh sách menu (filter, search, phân trang) |
| GET | `/:id` | Public | Chi tiết món |
| POST | `/` | Quản lý | Thêm món + upload ảnh (Multer) |
| PUT | `/:id` | Quản lý | Sửa thông tin món |
| DELETE | `/:id` | Quản lý | Xóa món |
| PATCH | `/:id/availability` | QL/NV | Bật/tắt hiển thị món |

### 🪑 Table — `/api/v1/tables`

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/` | NV/QL | Danh sách bàn + trạng thái |
| GET | `/:id` | NV/QL | Chi tiết bàn |
| POST | `/` | Quản lý | Thêm bàn + tạo QR code |
| PATCH | `/:id/status` | NV/QL | Đổi trạng thái bàn |
| DELETE | `/:id` | Quản lý | Xóa bàn |

### 📋 Order — `/api/v1/orders`

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/` | NV/QL | Tất cả đơn hàng |
| GET | `/my-orders` | Khách | Đơn của tôi |
| GET | `/:id` | Auth | Chi tiết đơn |
| POST | `/` | Auth | Tạo đơn hàng mới |
| PATCH | `/:id/status` | NV/QL | Cập nhật trạng thái đơn |
| PATCH | `/:id/items/:itemId/status` | NV | Cập nhật từng món |
| DELETE | `/:id` | QL | Hủy đơn hàng |

### 💳 Payment — `/api/v1/payments`

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| POST | `/` | NV/KH | Tạo thanh toán offline |
| POST | `/vnpay/create` | NV/KH | Tạo URL redirect VNPay |
| GET | `/vnpay/callback` | Public | VNPay IPN/Return URL handler |
| GET | `/:id` | Auth | Chi tiết payment |
| POST | `/:id/refund` | QL | Hoàn tiền |

### 📊 Report — `/api/v1/reports`

| Method | Endpoint | Quyền | Chức năng |
|--------|----------|-------|-----------|
| GET | `/revenue` | QL | Doanh thu theo ngày/tuần/tháng |
| GET | `/best-sellers` | QL | Món bán chạy nhất |
| GET | `/table-usage` | QL | Tần suất sử dụng bàn |
| GET | `/orders/summary` | QL | Tổng kết đơn hàng |

---

## ⚡ Socket.IO Events

```
┌─────────────────────────────────────────────────────────┐
│                  SOCKET EVENT FLOW                       │
│                                                          │
│  Khách đặt món                                           │
│      │ POST /api/v1/orders                               │
│      ▼                                                   │
│  [Order Service] ──emit──► "order:new"                   │
│                                  │                       │
│                    ┌─────────────┴──────────────┐        │
│                    ▼                            ▼        │
│            [Kitchen Screen]            [Staff Dashboard] │
│            (room: kitchen)             (room: staff)     │
│                    │                                     │
│  NV cập nhật món   │ PATCH /items/:id/status             │
│                    ▼                                     │
│  [Order Service] ──emit──► "order:item-updated"          │
│                                  │                       │
│                    ┌─────────────┴──────────────┐        │
│                    ▼                            ▼        │
│            [Table Screen]              [Customer Screen] │
│            (room: table:{id})          (room: table:{id})│
└─────────────────────────────────────────────────────────┘
```

### Client → Server
| Event | Room | Mô tả |
|-------|------|-------|
| `join-kitchen` | kitchen | Bếp đăng ký nhận đơn mới |
| `join-staff` | staff | NV phục vụ đăng ký |
| `join-table:{tableId}` | table:{id} | Khách theo dõi bàn của mình |

### Server → Client
| Event | Payload | Mô tả |
|-------|---------|-------|
| `order:new` | order object | Đơn mới được tạo |
| `order:item-updated` | { orderId, itemId, status } | Trạng thái món thay đổi |
| `order:status-changed` | { orderId, status } | Trạng thái đơn thay đổi |
| `table:status-changed` | { tableId, status } | Bàn đổi trạng thái |
| `payment:success` | payment object | Thanh toán thành công |

---

## 💳 VNPay Integration Flow

```
[Client] ──POST /vnpay/create──► [Backend tạo URL + ký HMAC-SHA512]
                                        │
                            ┌───────────▼──────────────┐
                            │  Redirect đến VNPay URL  │
                            └───────────┬──────────────┘
                                        │ Khách thanh toán
                            ┌───────────▼──────────────┐
                            │  VNPay redirect về       │
                            │  GET /vnpay/callback      │
                            └───────────┬──────────────┘
                                        │
                            [Verify chữ ký HMAC-SHA512]
                                        │
                            [Cập nhật Payment + Order status]
                                        │
                            [Emit Socket "payment:success"]
```

---

## 🎨 Frontend Screens & UI

### Màn hình Khách Hàng
| Màn hình | Mô tả |
|----------|-------|
| **LoginPage / RegisterPage** | Đăng nhập, đăng ký tài khoản |
| **MenuPage** | Grid món ăn, filter theo category, search, thêm vào giỏ |
| **CartPage** | Xem giỏ hàng, chỉnh số lượng, ghi chú từng món |
| **OrderPage** | Scan QR bàn → xác nhận đặt món |
| **MyOrdersPage** | Timeline trạng thái đơn (cập nhật real-time) |
| **PaymentPage** | Chọn VNPay / tiền mặt → xác nhận thanh toán |

### Màn hình Nhân Viên
| Màn hình | Mô tả |
|----------|-------|
| **StaffDashboard** | Tổng đơn hôm nay, bàn đang phục vụ, thông báo mới |
| **TablesPage** | Sơ đồ bàn dạng grid, màu sắc theo trạng thái, real-time |
| **OrdersPage** | Danh sách đơn, filter theo trạng thái, cập nhật nhanh |
| **KitchenPage** | Màn hình bếp: đơn mới nổi bật, đếm giờ chuẩn bị |
| **PaymentProcessPage** | Xử lý thanh toán cho khách tại bàn |

### Màn hình Quản Lý
| Màn hình | Mô tả |
|----------|-------|
| **ManagerDashboard** | KPI cards: doanh thu hôm nay, đơn hoàn thành, bàn đang dùng |
| **MenuManagePage** | CRUD menu, upload ảnh drag-drop, bật/tắt món |
| **TableManagePage** | Thêm/xóa bàn, tạo QR code, xem lịch sử sử dụng |
| **StaffManagePage** | Tạo tài khoản NV, phân quyền, bật/tắt tài khoản |
| **ReportPage** | Biểu đồ doanh thu (Recharts), bảng món bán chạy |

---

## 🔧 Kỹ Thuật JavaScript Đặc Trưng

### 1. Arrow Functions — Xuyên Suốt Toàn Bộ Project
```js
// Controller (backend)
const createOrder = async (req, res, next) => {
  const order = await OrderService.create(req.body, req.user);
  res.status(201).json(sendSuccess('Tạo đơn thành công', order));
};

// Custom Hook (frontend)
const useCart = () => {
  const addItem = (item) => setItems(prev => [...prev, item]);
  const removeItem = (id) => setItems(prev => prev.filter(i => i._id !== id));
  const calcTotal = () => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { addItem, removeItem, calcTotal };
};
```

### 2. Higher-Order Function — Middleware Factory (authorizeRole)
```js
// HOF: nhận danh sách roles → trả về middleware function
const authorizeRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json(sendError('Không có quyền truy cập'));
  }
  next();
};

// Dùng trong routes — cực kỳ tái sử dụng
router.post('/',      verifyToken, authorizeRole('quan_ly'), createMenuItem);
router.patch('/:id',  verifyToken, authorizeRole('quan_ly', 'nhan_vien'), updateStatus);
router.get('/reports',verifyToken, authorizeRole('quan_ly'), getReport);
```

### 3. Error-first Callbacks — Repository Layer
```js
// Tất cả hàm repository đều theo chuẩn Node.js callback
const findOrderById = (id, callback) => {
  Order.findById(id)
    .populate('items.menuItem table customer')
    .exec((err, order) => {
      if (err) return callback(err);
      if (!order) return callback(new AppError('Không tìm thấy đơn hàng', 404));
      callback(null, order);
    });
};

// Cách dùng ở Service layer
const getOrderDetail = (id, callback) => {
  OrderRepository.findOrderById(id, (err, order) => {
    if (err) return callback(err);
    callback(null, order);
  });
};
```

### 4. Async/Await + Arrow Function — Service Layer
```js
const createOrderService = async (orderData, user) => {
  // Arrow function trong reduce
  const totalAmount = orderData.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const order = await OrderRepository.create({
    ...orderData,
    totalAmount,
    orderedBy: user._id
  });

  // Emit real-time ngay sau khi tạo đơn
  getIO().to('kitchen').emit('order:new', order);
  getIO().to('staff').emit('order:new', order);

  return order;
};
```

### 5. Promise Chaining — VNPay Processing
```js
const processVNPayCallback = (vnpayData) =>
  verifyVNPaySignature(vnpayData)
    .then(isValid => {
      if (!isValid) throw new AppError('Chữ ký không hợp lệ', 400);
    })
    .then(() => PaymentRepository.findByOrderId(vnpayData.vnp_TxnRef))
    .then(payment =>
      PaymentRepository.update(payment._id, {
        status: 'da_thanh_toan',
        vnpayTransactionId: vnpayData.vnp_TransactionNo,
        paidAt: new Date()
      })
    )
    .then(payment => {
      getIO().emit('payment:success', payment);
      return payment;
    });
```

### 6. Axios Interceptor (Frontend) — Tự Động Đính JWT
```js
// services/api.js
const api = axios.create({ baseURL: '/api/v1' });

// Request interceptor — tự động đính token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = authStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — tự động logout khi token hết hạn
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) authStore.getState().logout();
    return Promise.reject(error);
  }
);
```

---

## 🔐 Phân Quyền RBAC

| Tính năng | Khách hàng | Nhân viên | Quản lý |
|-----------|:----------:|:---------:|:-------:|
| Xem menu | ✅ | ✅ | ✅ |
| Đặt món online | ✅ | ✅ | ✅ |
| Xem đơn của mình | ✅ | — | — |
| Xem tất cả đơn | — | ✅ | ✅ |
| Cập nhật trạng thái món | — | ✅ | ✅ |
| Màn hình bếp | — | ✅ | ✅ |
| Xử lý thanh toán | — | ✅ | ✅ |
| CRUD Menu | — | — | ✅ |
| Quản lý bàn | — | ✅ (giới hạn) | ✅ |
| Báo cáo & thống kê | — | — | ✅ |
| Tạo tài khoản nhân viên | — | — | ✅ |

---

## 📦 Dependencies

### Backend
```json
{
  "dependencies": {
    "express": "^4.18",
    "mongoose": "^8.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "socket.io": "^4.x",
    "multer": "^1.x",
    "joi": "^17.x",
    "helmet": "^7.x",
    "cors": "^2.x",
    "morgan": "^1.x",
    "dotenv": "^16.x",
    "qrcode": "^1.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "socket.io-client": "^4.x",
    "zustand": "^4.x",
    "recharts": "^2.x",
    "react-hook-form": "^7.x",
    "react-hot-toast": "^2.x",
    "@tailwindcss/forms": "^0.5.x"
  }
}
```

### Root package.json (chạy cả 2 cùng lúc)
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
    "install:all": "npm install && npm install --workspace=backend && npm install --workspace=frontend"
  },
  "devDependencies": {
    "concurrently": "^8.x"
  }
}
```

---

## 📅 Kế Hoạch Triển Khai (5 Phases)

### ✅ Phase 1 — Project Setup & Auth (Tuần 1)
**Backend:**
- [ ] Khởi tạo Node.js project, cài dependencies
- [ ] Cấu hình MongoDB + Mongoose connection
- [ ] Tạo User model + middleware (verifyToken, authorizeRole HOF)
- [ ] Implement Auth API (register, login, /me)
- [ ] Cấu hình static file serving (`/uploads`)

**Frontend:**
- [ ] Khởi tạo React + Vite + Tailwind
- [ ] Setup React Router v6 + PrivateRoute theo role
- [ ] Cấu hình Axios instance + JWT interceptor
- [ ] Trang Login / Register với validation

---

### ✅ Phase 2 — Menu & Table (Tuần 2)
**Backend:**
- [ ] MenuItem model + Repository + Service + Controller
- [ ] Menu CRUD API + Multer upload ảnh local
- [ ] Table model + Repository + Service + Controller
- [ ] Table API + QR code generation (thư viện `qrcode`)

**Frontend:**
- [ ] MenuPage (grid + filter category + search)
- [ ] MenuManagePage (CRUD + drag-drop upload ảnh)
- [ ] TablesPage (sơ đồ bàn, màu theo trạng thái)
- [ ] TableManagePage (thêm/xóa bàn)

---

### ✅ Phase 3 — Order & Real-time (Tuần 3)
**Backend:**
- [ ] Order model + Repository + Service + Controller
- [ ] Order CRUD + cập nhật trạng thái API
- [ ] Socket.IO setup (rooms: kitchen, staff, table:{id})
- [ ] Emit events khi order/item status thay đổi

**Frontend:**
- [ ] cartStore (Zustand) + useCart hook
- [ ] CartPage + OrderPage (scan QR)
- [ ] KitchenPage (real-time — Socket.IO client)
- [ ] OrdersPage nhân viên (cập nhật status)
- [ ] MyOrdersPage khách (timeline real-time)

---

### ✅ Phase 4 — Payment VNPay (Tuần 4)
**Backend:**
- [ ] Payment model + Repository
- [ ] vnpay.util.js: tạo URL + verify HMAC-SHA512
- [ ] Payment API: tạo thanh toán, callback/return handler
- [ ] Offline payment (tiền mặt / chuyển khoản)

**Frontend:**
- [ ] PaymentPage (chọn phương thức)
- [ ] Redirect sang VNPay + xử lý return URL
- [ ] PaymentProcessPage nhân viên
- [ ] Hiển thị trạng thái thanh toán real-time

---

### ✅ Phase 5 — Report & Polish (Tuần 5)
**Backend:**
- [ ] Report Service: MongoDB aggregation pipeline
- [ ] Report API: doanh thu, best-sellers, table usage
- [ ] Input validation toàn bộ với Joi
- [ ] Global error handler chuẩn hóa

**Frontend:**
- [ ] ReportPage (Recharts: line chart doanh thu, bar chart món bán chạy)
- [ ] ManagerDashboard (KPI cards animated)
- [ ] StaffManagePage (tạo/quản lý nhân viên)
- [ ] Responsive design (mobile-first)
- [ ] Toast notifications cho tất cả actions

---

*Document generated by Antigravity AI — Restaurant Management System*
