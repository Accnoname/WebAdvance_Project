# 🤖 AGENTS.md — Quy Tắc & Luật Code Dự Án

> File này định nghĩa các quy tắc coding, convention và hướng dẫn cho AI agent  
> khi làm việc trên dự án **Restaurant Management System**.

---

## 📋 Thông Tin Dự Án

- **Tên**: Restaurant Management System
- **Stack**: Node.js + Express + MongoDB (Backend) | React 18 + Vite + Tailwind (Frontend)
- **Pattern**: MVC + Repository Pattern + Service Layer
- **Auth**: JWT (stateless)
- **Real-time**: Socket.IO
- **Thanh toán**: VNPay + Offline
- **Ảnh**: Lưu local với Multer (`backend/uploads/menu/`)

---

## 🧠 Quy Tắc Hành Vi AI Agent

> Đây là phần quan trọng nhất — định nghĩa cách AI phải ứng xử khi làm việc với project này.

### 1. Quy Trình Trả Lời (Response Workflow)

Trước khi viết bất kỳ dòng code nào, AI **BẮT BUỘC** phải thực hiện theo thứ tự:

```
BƯỚC 1 — ĐỌC CONTEXT
  → Xác định yêu cầu thuộc tuần nào (WEEK1..WEEK5)
  → Đọc file WEEK*.md tương ứng nếu cần
  → Xác định file nào cần chỉnh sửa (backend hay frontend)

BƯỚC 2 — LÀM RÕ (nếu chưa rõ)
  → Đặt câu hỏi TRƯỚC khi code nếu yêu cầu mơ hồ
  → KHÔNG tự suy diễn rồi viết code sai

BƯỚC 3 — THÔNG BÁO KẾ HOẠCH
  → Nói ngắn gọn sẽ làm gì trước khi thực hiện
  → Liệt kê các file sẽ bị ảnh hưởng

BƯỚC 4 — THỰC HIỆN
  → Viết code đúng convention (arrow function, callbacks...)
  → Không bỏ qua error handling
  → Không xóa code cũ nếu chưa được yêu cầu

BƯỚC 5 — BÁO CÁO KẾT QUẢ
  → Tóm tắt đã làm gì
  → Gợi ý bước tiếp theo nếu cần
```

---

### 2. Cách Làm Rõ Yêu Cầu (Clarification Rules)

**Khi nào PHẢI hỏi lại trước khi code:**
- Yêu cầu ảnh hưởng đến **nhiều hơn 3 file**
- Yêu cầu thay đổi **schema database** (có thể ảnh hưởng data cũ)
- Yêu cầu liên quan đến **VNPay hoặc security**
- Yêu cầu **xóa hoặc refactor** logic đang hoạt động
- Có **2 cách implement** khác nhau và không rõ ưu tiên

**Mẫu câu hỏi làm rõ:**
```
❓ "Bạn muốn cập nhật trạng thái đơn hàng tự động khi thanh toán
   xong, hay để nhân viên xác nhận thủ công?"

❓ "Route này cần phân quyền cho cả nhan_vien lẫn quan_ly,
   hay chỉ quan_ly thôi?"

❓ "Khi xóa món ăn, bạn muốn xóa hẳn khỏi DB hay chỉ
   set isAvailable = false để giữ lịch sử order?"
```

**Khi nào KHÔNG cần hỏi — tự làm luôn:**
- Fix lỗi cú pháp / typo rõ ràng
- Thêm `try/catch` vào controller đang thiếu
- Format code theo convention đã định
- Thêm comment giải thích code

---

### 3. Cấu Trúc Câu Trả Lời Chuẩn

AI phải trả lời theo cấu trúc sau, **không viết dài dòng không cần thiết**:

```
## 🔍 Phân Tích
[1-2 câu mô tả hiểu vấn đề như thế nào]

## 📝 Sẽ Thay Đổi
- `backend/src/services/order.service.js` — thêm logic X
- `backend/src/routes/order.routes.js` — thêm route Y

## 💻 Code
[code block]

## ✅ Kết Quả
[mô tả ngắn kết quả đạt được]

## ➡️ Bước Tiếp Theo (nếu cần)
[gợi ý action tiếp theo]
```

---

### 4. Xử Lý Khi Gặp Lỗi (Error Handling Protocol)

**Khi phát hiện lỗi trong code người dùng gửi:**

```
BƯỚC 1 — Xác định loại lỗi:
  🔴 Runtime Error   → lỗi khi chạy (null reference, async/await sai)
  🟡 Logic Error     → chạy được nhưng kết quả sai
  🔵 Convention Error → không theo AGENTS.md (dùng function thay arrow fn)
  ⚪ Warning         → không sai nhưng có thể cải thiện

BƯỚC 2 — Báo cáo rõ ràng:
  → Nói file + dòng bị lỗi
  → Giải thích TẠI SAO lỗi (không chỉ sửa)
  → Đưa ra fix + giải thích cách fix

BƯỚC 3 — Kiểm tra side effects:
  → Lỗi này có ảnh hưởng file khác không?
  → Có cần cập nhật test không?
```

**Mẫu báo lỗi chuẩn:**
```
🔴 LỖI PHÁT HIỆN: `order.service.js` dòng 42

VẤN ĐỀ:
  getIO() được gọi trước khi initSocket() chạy xong
  → Server crash khi có request đầu tiên

NGUYÊN NHÂN:
  socket.js export getIO() nhưng io chưa được khởi tạo
  vì initSocket() chưa được gọi trong server.js

FIX:
  [code fix]

KIỂM TRA THÊM:
  → server.js phải gọi initSocket(server) TRƯỚC khi listen
```

---

### 5. Quy Tắc Khi Chỉnh Sửa File Hiện Có

```
✅ ĐƯỢC PHÉP:
  → Thêm code mới vào cuối function
  → Thêm field mới vào schema (không xóa field cũ)
  → Thêm route mới vào routes file
  → Refactor logic giữ nguyên interface/API contract

❌ KHÔNG ĐƯỢC PHÉP nếu chưa được hỏi:
  → Xóa hoặc rename field trong MongoDB schema
  → Thay đổi response format của API đang hoạt động
  → Xóa middleware đang bảo vệ route
  → Thay đổi tên biến export (vì file khác đang import)
  → Cài thêm package mới vào package.json
```

---

### 6. Phân Biệt Công Việc Backend vs Frontend

Khi nhận yêu cầu mơ hồ, AI phải xác định rõ:

```
YÊU CẦU THUỘC BACKEND nếu liên quan đến:
  → Database query / Mongoose
  → API endpoint / Express route
  → JWT / Authentication logic
  → Socket.IO emit
  → VNPay / business logic
  → File upload / Multer

YÊU CẦU THUỘC FRONTEND nếu liên quan đến:
  → React component / UI
  → Zustand store / state
  → Axios API call
  → CSS / Tailwind styling
  → React Router / navigation
  → Socket.IO listener (client side)

YÊU CẦU CẦN CẢ HAI:
  → Thêm tính năng mới hoàn chỉnh (cần API + UI)
  → Trong trường hợp này: làm Backend TRƯỚC, Frontend SAU
  → Xác nhận API contract trước khi viết Frontend
```

---

### 7. Convention Đặt Tên Khi AI Tạo Code Mới

```js
// Variables: camelCase
const totalAmount = 0;
const menuItemId = req.params.id;

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SALT_ROUNDS = 12;

// Functions/Methods: camelCase + động từ
const createOrder = async () => {};
const findByEmail = (email, cb) => {};
const formatCurrency = (amount) => {};

// Mongoose Models: PascalCase (singular)
const Order = mongoose.model('Order', orderSchema);

// React Components: PascalCase
const MenuCard = ({ item }) => {};
const OrderTimeline = ({ order }) => {};

// Hooks: camelCase, bắt đầu bằng "use"
const useAuth = () => {};
const useSocket = (room) => {};

// Zustand Stores: camelCase + "Store"
const useAuthStore = create(...);
const useCartStore = create(...);

// Error messages: tiếng Việt, rõ ràng
throw new AppError('Email đã được sử dụng', 409);
throw new AppError('Không tìm thấy đơn hàng', 404);
throw new AppError('Không có quyền thực hiện hành động này', 403);
```

---

### 8. Checklist Trước Khi Commit Code

AI phải nhắc developer kiểm tra các điểm sau trước khi commit:

```
□ Tất cả function dùng arrow function (không có keyword `function`)
□ Không còn console.log debug
□ Tất cả async controller có try/catch + next(error)
□ Không hardcode giá trị — dùng process.env hoặc constants.js
□ Password không được trả về trong response
□ File upload được validate đúng type + size
□ Socket.IO emit chỉ sau khi DB đã lưu thành công
□ Axios call trên frontend có xử lý loading + error state
□ Không có TODO còn sót trong code production
□ Import đúng thứ tự (built-in → third-party → internal)
```

---

### 9. Xử Lý Tình Huống Đặc Biệt

#### Khi developer báo lỗi không có stack trace
```
AI phải hỏi:
1. "Lỗi xảy ra ở bước nào? (gọi API / render UI / khi submit form)"
2. "Console browser/terminal báo gì?"
3. "Lỗi này mới xuất hiện sau khi thay đổi gì?"
```

#### Khi yêu cầu mâu thuẫn với convention
```
AI phải:
1. Chỉ ra mâu thuẫn cụ thể
2. Giải thích tại sao convention hiện tại tồn tại
3. Đề xuất cách giải quyết vẫn giữ được convention
4. Nếu developer vẫn muốn override → làm nhưng thêm comment giải thích lý do
```

#### Khi cần thêm package mới
```
AI phải:
1. Giải thích tại sao cần package đó
2. Kiểm tra xem project đã có thư viện tương tự chưa
3. Xác nhận với developer trước khi thêm vào package.json
4. Ưu tiên package nhỏ, ít dependency, được maintain tốt
```

#### Khi không chắc chắn về logic nghiệp vụ nhà hàng
```
AI phải hỏi về:
- Quy trình thực tế của nhà hàng (ví dụ: bàn có được dùng lại ngay không?)
- Ai có quyền hủy đơn hàng đã giao?
- Khi nào bàn trở về trạng thái "trống"?
- Phí ship / thuế có tính vào totalAmount không?
```

---

### 10. Ngôn Ngữ & Giao Tiếp

```
✅ AI trả lời bằng TIẾNG VIỆT (vì team nói tiếng Việt)

✅ Code comment: tiếng Việt cho logic nghiệp vụ
   // Snapshot giá lúc đặt — không dùng price từ MenuItem
   // Emit sau khi lưu DB thành công

✅ Error message trong code: tiếng Việt
   'Không tìm thấy đơn hàng'
   'Email đã được sử dụng'

✅ Tên biến / function: tiếng Anh (camelCase)
   createOrder, findByEmail, totalAmount

❌ KHÔNG trộn lẫn ngôn ngữ trong cùng một câu trả lời
❌ KHÔNG dùng thuật ngữ kỹ thuật tiếng Anh khi có tương đương tiếng Việt rõ ràng
```

---

## ⚡ Quy Tắc JavaScript Bắt Buộc

### 1. LUÔN dùng Arrow Function — KHÔNG dùng `function` keyword

```js
// ✅ ĐÚNG
const createOrder = async (req, res, next) => { ... };
const getAll = async (query) => { ... };
const formatPrice = (price) => price.toLocaleString('vi-VN');

// ❌ SAI — Không được dùng
function createOrder(req, res, next) { ... }
async function getAll(query) { ... }
```

### 2. Error-first Callbacks tại Repository Layer

```js
// ✅ ĐÚNG — Repository dùng callback
const findById = (id, callback) => {
  Model.findById(id).exec((err, doc) => {
    if (err) return callback(err);
    if (!doc) return callback(new AppError('Không tìm thấy', 404));
    callback(null, doc);
  });
};

// ✅ Service layer dùng async/await
const getDetail = async (id) => {
  return new Promise((resolve, reject) => {
    Repository.findById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
};
```

### 3. Higher-Order Functions cho Middleware

```js
// ✅ authorizeRole là HOF — bắt buộc viết theo dạng này
const authorizeRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json(sendError('Không có quyền', 403));
  }
  next();
};

// validate cũng là HOF
const validate = (schema) => (req, res, next) => { ... };
```

### 4. Async/Await — KHÔNG dùng `.then().catch()` lồng nhau

```js
// ✅ ĐÚNG
const createMenuItem = async (data, file) => {
  const existing = await MenuItemRepository.findOne({ name: data.name });
  if (existing) throw new AppError('Tên món đã tồn tại', 409);
  return await MenuItemRepository.create(data);
};

// ❌ TRÁNH — lồng then/catch nhiều tầng
const createMenuItem = (data) =>
  MenuItemRepository.findOne({ name: data.name })
    .then(existing => {
      if (existing) throw new Error('...');
      return MenuItemRepository.create(data);
    })
    .then(item => item)
    .catch(err => { throw err; });
```

### 5. Destructuring + Spread Operator

```js
// ✅ ĐÚNG
const { name, email, password } = req.body;
const updatedData = { ...existingData, ...newData, updatedAt: new Date() };
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
```

---

## 📁 Quy Tắc Cấu Trúc File

### Đặt tên file
```
backend/
  Models:       PascalCase + .model.js      → User.model.js
  Repositories: camelCase + .repository.js  → user.repository.js
  Services:     camelCase + .service.js     → auth.service.js
  Controllers:  camelCase + .controller.js  → auth.controller.js
  Routes:       camelCase + .routes.js      → auth.routes.js
  Middlewares:  camelCase + .middleware.js  → auth.middleware.js
  Utils:        camelCase + .util.js        → jwt.util.js

frontend/
  Pages:        PascalCase + Page.jsx       → LoginPage.jsx
  Components:   PascalCase + .jsx           → MenuCard.jsx
  Hooks:        camelCase, prefix use       → useAuth.js
  Store:        camelCase + Store.js        → authStore.js
  Services:     camelCase + .service.js     → auth.service.js
  Utils:        camelCase + .js             → formatCurrency.js
```

### Thứ tự import trong file
```js
// 1. Node.js built-in modules
const path = require('path');
const crypto = require('crypto');

// 2. Third-party packages
const express = require('express');
const mongoose = require('mongoose');

// 3. Internal modules (từ gần đến xa)
const { sendSuccess } = require('../utils/response.util');
const UserRepository = require('../repositories/user.repository');
```

---

## 🔌 API Response Format

> **BẮT BUỘC** dùng `response.util.js` cho mọi response — không tự format

```js
// ✅ Thành công
res.status(200).json(sendSuccess('Thông báo', data));
res.status(201).json(sendSuccess('Tạo thành công', data, 201));

// ✅ Thất bại — dùng next(error) hoặc sendError
next(new AppError('Lỗi cụ thể', statusCode));
res.status(400).json(sendError('Lỗi', 400, ['chi tiết lỗi']));

// ✅ Có phân trang
res.status(200).json(sendPaginated('Danh sách', data, { page, limit, total }));
```

### Chuẩn response JSON
```json
{
  "success": true | false,
  "statusCode": 200,
  "message": "Mô tả kết quả",
  "data": { ... } | null,
  "pagination": { ... } | undefined
}
```

---

## 🔐 Bảo Mật

- **KHÔNG BAO GIỜ** log `password`, `JWT_SECRET`, `VNPAY_HASH_SECRET` ra console
- **KHÔNG** hardcode credentials — luôn dùng `process.env.*`
- **LUÔN** verify VNPay signature trước khi xử lý callback
- Password **PHẢI** hash bằng bcrypt trước khi lưu DB
- Token **PHẢI** đi qua `verifyToken()` — không decode thủ công
- **KHÔNG** trả về trường `password` trong bất kỳ response nào

---

## 🗄️ MongoDB / Mongoose

- **LUÔN** dùng `{ timestamps: true }` trong tất cả schema
- **LUÔN** snapshot `price` vào Order item — không ref MenuItem (giá có thể thay đổi)
- Dùng `{ new: true, runValidators: true }` khi update
- Dùng `.populate()` ở Repository layer, không ở Controller
- Index các trường thường query: `email` (User), `tableNumber` (Table), `orderStatus` (Order)

```js
// ✅ ĐÚNG — snapshot price
items: [{
  menuItem: ObjectId,
  price: Number,   // copy từ MenuItem.price tại thời điểm đặt
  quantity: Number
}]
```

---

## ⚡ Socket.IO

- **Đặt tên event**: dùng dạng `entity:action` (kebab-case)
  ```
  order:new, order:item-updated, order:status-changed
  table:status-changed, payment:success
  ```
- **Luôn** dùng rooms — không broadcast `io.emit()` trừ trường hợp cần toàn bộ
- Emit socket **sau** khi đã lưu DB thành công (không emit trước)
- Cleanup socket `disconnect` event trong `socket.config.js`

---

## 🎨 Frontend — React

- **LUÔN** dùng arrow function cho component:
  ```jsx
  // ✅
  const MenuCard = ({ item, onAddToCart }) => { ... };
  export default MenuCard;

  // ❌
  function MenuCard({ item }) { ... }
  ```
- **KHÔNG** dùng `useEffect` để fetch data nếu có thể dùng `useCallback` hoặc event handler
- **LUÔN** handle loading và error state khi gọi API
- Dùng `react-hot-toast` cho tất cả thông báo — không dùng `alert()`
- Format tiền VND: `formatCurrency()` từ `utils/formatCurrency.js`
- Format ngày: `formatDate()` từ `utils/formatDate.js`
- Status labels: dùng `STATUS_LABELS` từ `utils/constants.js`

---

## 🌿 Git Rules

### Branch naming
```
backend/<weekN>-<feature>    → backend/week1-auth
frontend/<weekN>-<feature>   → frontend/week1-login-page
hotfix/<description>         → hotfix/fix-vnpay-signature
```

### Commit format
```
<type>(<scope>): <mô tả>

feat(auth): implement JWT verifyToken middleware
fix(order): fix totalAmount calculation in createOrder
style(menu): improve MenuCard hover animation
docs(week3): update Socket.IO event payload format
```

### PR Rules
- Tạo PR vào `develop` (không merge thẳng vào `main`)
- PR title: `[WeekN] Backend/Frontend - Mô tả ngắn gọn`
- Người còn lại **PHẢI** review trước khi merge
- Không merge PR nếu còn TODO chưa giải quyết

---

## ❌ Những Thứ Bị Cấm

```js
// ❌ Không dùng var
var name = 'John';           // Dùng const hoặc let

// ❌ Không để console.log debug
console.log('testing...');   // Xóa trước khi commit

// ❌ Không trả password trong response
res.json({ user });          // Phải delete user.password hoặc dùng .toJSON()

// ❌ Không skip try/catch trong async controller
const handler = async (req, res) => {
  const data = await Service.doSomething(); // Không có try/catch → crash!
};

// ✅ ĐÚNG — luôn có try/catch hoặc dùng asyncHandler wrapper
const handler = async (req, res, next) => {
  try {
    const data = await Service.doSomething();
    res.json(sendSuccess('OK', data));
  } catch (error) {
    next(error);
  }
};
```

---

## 📁 Cấu Trúc Thư Mục

```
d:\Web Nhà Hàng\
├── backend/            # Express API Server
├── frontend/           # React SPA
├── docs/               # Kế hoạch theo tuần
│   ├── WEEK1_Auth_Setup.md
│   ├── WEEK2_Menu_Table.md
│   ├── WEEK3_Order_Realtime.md
│   ├── WEEK4_Payment.md
│   └── WEEK5_Report_Polish.md
├── .agents/
│   └── AGENTS.md       # File này — luật cho AI
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## 🛠️ Quy Tắc Sử Dụng AI Skills

AI Agent đã được trang bị các Local Skills để hỗ trợ công việc. Khi thực hiện task, AI **phải** chủ động kích hoạt các skill này nếu phù hợp:

### 1. Skill: `frontend-design`
- **Mục đích**: Thiết kế giao diện Frontend đẳng cấp, không bị nhàm chán kiểu "AI slop".
- **Khi nào dùng**: Khi Dev B (Frontend) yêu cầu tạo UI component, page, layout mới.
- **Cách dùng**: 
  - AI phải chọn một "Tone" thiết kế (ví dụ: minimalist, luxury, playful...) phù hợp với role (Khách/Nhân viên/Quản lý).
  - Tránh các pattern cũ (như card trắng shadow mờ, font Inter mặc định).
  - Áp dụng màu sắc đúng `tailwind.config.js` của dự án.

### 2. Skill: `write-academic-vietnamese` / `write`
- **Mục đích**: Hỗ trợ viết báo cáo, tài liệu chuẩn mực.
- **Khi nào dùng**: Khi cần cập nhật README, viết hướng dẫn deploy, hoặc làm tài liệu báo cáo cuối tuần 5.

### 3. Skill: `accidental-data-loss-prevention`
- **Mục đích**: Chống xóa nhầm dữ liệu.
- **Khi nào dùng**: Bất cứ khi nào có yêu cầu drop database, xóa table, hoặc chạy lệnh có nguy cơ mất mát dữ liệu (ví dụ: xóa file upload). AI **BẮT BUỘC** phải xác nhận (confirm) lại với người dùng trước khi thực hiện.

---

*Cập nhật: 29/06/2026 | Restaurant Management System*
