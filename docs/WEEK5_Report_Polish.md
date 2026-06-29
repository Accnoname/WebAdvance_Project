# 📅 TUẦN 5 — Report, Validation & Polish

> **Thời gian**: Tuần 5  
> **Mục tiêu**: Báo cáo thống kê + Validation + Hoàn thiện toàn bộ UI/UX

---

## 🎯 Mục Tiêu Cuối Tuần

- [ ] Dashboard Quản lý có KPIs + biểu đồ Recharts đẹp
- [ ] Báo cáo doanh thu, món bán chạy hoạt động
- [ ] Toàn bộ form có validation Joi (backend) + react-hook-form (frontend)
- [ ] Global error handler chuẩn hóa — không còn lỗi unhandled
- [ ] UI responsive trên mobile
- [ ] Sẵn sàng demo / deploy

---

## 👨‍💻 Dev A — Backend

### Ngày 1-2: Report Service (MongoDB Aggregation)
- [ ] Implement `report.service.js` — `getRevenue`:
  ```js
  const getRevenue = async ({ period, from, to }) => {
    // period: 'day' | 'week' | 'month'
    // Dùng MongoDB $group + $sum trên Payment collection
    // Return: [{ date, totalRevenue, orderCount }]
  };
  ```
- [ ] Implement `getBestSellers`:
  ```js
  const getBestSellers = async () => {
    // Aggregate Order.items → group by menuItem
    // Sort by totalQuantity DESC
    // Populate menuItem name + image
    // Return top 10
  };
  ```
- [ ] Implement `getTableUsage`:
  ```js
  // Đếm số đơn theo từng bàn trong tháng
  // Return: [{ tableNumber, orderCount, revenue }]
  ```
- [ ] Test bằng Postman với data seed thực tế

### Ngày 2-3: Joi Validation Toàn Bộ
- [ ] Tạo thư mục `src/validations/`
- [ ] `auth.validation.js`:
  ```js
  const registerSchema = Joi.object({
    name:     Joi.string().min(2).max(50).required(),
    email:    Joi.string().email().required(),
    phone:    Joi.string().pattern(/^[0-9]{10}$/).optional(),
    password: Joi.string().min(6).required(),
  });
  const loginSchema = Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  });
  ```
- [ ] `menu.validation.js`, `order.validation.js`, `payment.validation.js`
- [ ] Áp dụng `validate(schema)` middleware vào tất cả POST/PUT routes

### Ngày 3-4: Chuẩn Hóa Error + Security
- [ ] Review tất cả services — thay `throw new Error('TODO')` thành code thật
- [ ] Đảm bảo tất cả lỗi đều đi qua `next(error)` trong controller
- [ ] Thêm rate limiting cho auth routes (tránh brute force):
  ```js
  const rateLimit = require('express-rate-limit');
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
  router.post('/login', authLimiter, ...);
  ```
- [ ] Review CORS config — chỉ cho phép domain frontend

### Ngày 4-5: Seed Data + Tài Liệu
- [ ] Tạo `src/seeds/index.js` — chạy tất cả seed cùng lúc
- [ ] Seed đủ data để demo:
  - 15 món ăn đa dạng (có ảnh mẫu)
  - 10 bàn
  - 3 tài khoản: 1 quản lý, 2 nhân viên
  - 20 đơn hàng lịch sử (30 ngày gần nhất)
  - Payment records tương ứng
- [ ] Tạo `API.md` — document tất cả endpoints với ví dụ

---

## 👩‍💻 Dev B — Frontend

### Ngày 1-2: ManagerDashboard (KPI + Charts)
- [ ] Implement `ManagerDashboard.jsx`:
  - **KPI Cards** (4 card hàng đầu):
    - 💰 Doanh thu hôm nay
    - 📋 Đơn hàng hôm nay
    - 🪑 Bàn đang phục vụ
    - 🍜 Món đã bán
  - **Biểu đồ doanh thu** (Recharts LineChart):
    - X: ngày trong tuần / tháng
    - Y: doanh thu (VND)
    - Filter: 7 ngày / 30 ngày / tháng này
  - **Bảng món bán chạy** (top 5):
    - Ảnh, tên, số lượng, doanh thu

### Ngày 2-3: ReportPage
- [ ] Implement `ReportPage.jsx`:
  - **Tab 1 — Doanh thu**:
    - Date range picker (from/to)
    - BarChart theo ngày
    - Tổng cộng
  - **Tab 2 — Món bán chạy**:
    - PieChart phân bổ danh mục
    - Table top 10 món
  - **Tab 3 — Bàn**:
    - BarChart tần suất sử dụng từng bàn

### Ngày 3-4: StaffManagePage + Polish
- [ ] Implement `StaffManagePage.jsx`:
  - Danh sách nhân viên
  - Form tạo tài khoản nhân viên mới
  - Toggle bật/tắt tài khoản
- [ ] Polish toàn bộ UI:
  - Loading spinner khi đang fetch data
  - Empty state khi không có dữ liệu
  - Error message khi API lỗi
  - Confirm dialog trước khi xóa

### Ngày 4-5: Responsive + Final Check
- [ ] Test responsive trên mobile (375px, 768px)
- [ ] Đảm bảo tất cả form có validation message rõ ràng
- [ ] Kiểm tra tất cả routes có đúng PrivateRoute không
- [ ] Test toàn bộ user flow:
  - **Khách**: Xem menu → Đặt món → Theo dõi → Thanh toán
  - **Nhân viên**: Xem bàn → Xử lý đơn → Bếp → Thu tiền
  - **Quản lý**: Dashboard → Quản lý menu → Báo cáo

---

## 📊 Report API Contract

### GET `/api/v1/reports/revenue`
```
Query: ?period=week&from=2026-06-01&to=2026-06-29

Response 200:
{
  "success": true,
  "data": {
    "summary": { "totalRevenue": 15000000, "totalOrders": 230 },
    "chart": [
      { "date": "2026-06-23", "revenue": 2100000, "orders": 32 },
      { "date": "2026-06-24", "revenue": 1850000, "orders": 28 },
      ...
    ]
  }
}
```

### GET `/api/v1/reports/best-sellers`
```
Response 200:
{
  "success": true,
  "data": [
    {
      "menuItem": { "_id": "...", "name": "Phở Bò", "image": "/uploads/..." },
      "totalQuantity": 145,
      "totalRevenue": 9425000
    },
    ...
  ]
}
```

---

## 📦 Recharts Components

```jsx
// Dev B dùng các chart sau:
import { LineChart, BarChart, PieChart, Line, Bar, Pie,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend,
         ResponsiveContainer } from 'recharts';

// Format số tiền trong tooltip:
const formatVND = (value) => `${value.toLocaleString('vi-VN')}đ`;
```

---

## ✅ Definition of Done Cuối Dự Án

### Backend
- [ ] Tất cả endpoints không còn `TODO` — có code thật
- [ ] Joi validation áp dụng cho tất cả routes nhận body
- [ ] Global error handler bắt mọi lỗi
- [ ] Seed data chạy được bằng 1 lệnh
- [ ] `npm start` chạy production mode không có lỗi

### Frontend
- [ ] Tất cả pages không còn placeholder "TODO"
- [ ] 3 user flow hoàn chỉnh chạy được
- [ ] Responsive trên mobile
- [ ] Không có warning React trong console
- [ ] Loading + error states cho mọi API call

### Tổng thể
- [ ] Tạo PR cuối từ `develop` → `main`
- [ ] Viết `DEPLOYMENT.md` hướng dẫn deploy
- [ ] Demo được với data thật (seed sẵn)

---

## 🚀 Checklist Deploy (Optional)

```
Backend:
  → Deploy lên Railway / Render (free tier)
  → MongoDB: MongoDB Atlas (free cluster)
  → Thay MONGO_URI trong env

Frontend:
  → Deploy lên Vercel / Netlify
  → Thay VITE_API_URL → production URL
  → Cập nhật CORS backend cho phép domain Vercel
```

---

## 📌 Branch & PR cuối

```
Dev A: git checkout -b backend/week5-report-polish
Dev B: git checkout -b frontend/week5-report-polish

# PR cuối:
# [Week5] Backend - Report API + Validation + Security
# [Week5] Frontend - Dashboard, Reports, Polish UI

# Sau khi merge develop:
git checkout main
git merge develop
git tag v1.0.0
```
