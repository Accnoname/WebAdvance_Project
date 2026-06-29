# 📅 TUẦN 1 — Auth & Project Setup

> **Thời gian**: Tuần 1  
> **Mục tiêu**: Dựng khung dự án hoàn chỉnh + Hệ thống xác thực JWT

---

## 🎯 Mục Tiêu Cuối Tuần

Khi kết thúc tuần 1, cả team phải đạt được:
- [ ] Monorepo chạy được bằng lệnh `npm run dev`
- [ ] API Auth hoạt động: Register, Login, /me
- [ ] Frontend có trang Login/Register giao tiếp được với API
- [ ] JWT được truyền đúng trong headers
- [ ] Merge thành công vào `develop`

---

## 👨‍💻 Dev A — Backend

### Ngày 1-2: Project Setup
- [ ] Khởi tạo `backend/` với Node.js + Express
- [ ] Cài đặt tất cả dependencies từ `package.json`
- [ ] Cấu hình `.env` từ `.env.example`
- [ ] Test kết nối MongoDB (local hoặc MongoDB Atlas)
- [ ] Chạy được `npm run dev` → server lắng nghe `:3000`
- [ ] Test `GET /health` trả về `{ status: "OK" }`

### Ngày 2-3: User Model + Auth Logic
- [ ] Kiểm tra `User.model.js` (schema đã có sẵn)
- [ ] Implement `UserRepository.findByEmail()` + `findByEmailWithPassword()`
- [ ] Implement `AuthService.register()`:
  - Kiểm tra email đã tồn tại chưa
  - Hash password bằng bcrypt
  - Tạo user mới
  - Trả về token
- [ ] Implement `AuthService.login()`:
  - Tìm user theo email
  - So sánh password
  - Tạo JWT token → trả về user + token

### Ngày 3-4: Middleware + Routes
- [ ] Kiểm tra `auth.middleware.js` (`authenticate`, `authorizeRole` HOF)
- [ ] Kiểm tra `error.middleware.js` (global error handler)
- [ ] Hoàn thiện `auth.routes.js` (register, login, /me, create-staff)
- [ ] Implement `AuthController.getMe()` → trả về thông tin user từ `req.user`
- [ ] Cấu hình static file serving `/uploads`

### Ngày 4-5: Test + Tài liệu
- [ ] Test tất cả endpoints bằng Postman/Thunder Client
- [ ] Export Postman collection → commit vào `docs/postman/`
- [ ] Viết API contract (xem phần dưới) để Dev B biết cách gọi

---

## 👩‍💻 Dev B — Frontend

### Ngày 1-2: Project Setup
- [ ] Khởi tạo `frontend/` với Vite + React + Tailwind
- [ ] Cài đặt tất cả dependencies từ `package.json`
- [ ] Cấu hình `vite.config.js` proxy `/api` → `localhost:3000`
- [ ] Cấu hình Tailwind + `index.css` (đã có sẵn)
- [ ] Chạy được `npm run dev` → app hiển thị `:5173`

### Ngày 2-3: Router + Store
- [ ] Kiểm tra `router/index.jsx` (routes đã có sẵn)
- [ ] Kiểm tra `store/authStore.js` (Zustand persist)
- [ ] Cấu hình `services/api.js` (Axios + interceptors JWT)
- [ ] Test interceptor: request có đính Bearer token không

### Ngày 3-4: Login Page
- [ ] Implement `LoginPage.jsx` hoàn chỉnh:
  - Form với `react-hook-form` (email, password)
  - Validation: email hợp lệ, password tối thiểu 6 ký tự
  - Gọi `authService.login()` → lưu vào `authStore`
  - Redirect về `/` sau khi login thành công
  - Hiển thị toast error khi thất bại
- [ ] Implement `RegisterPage.jsx`:
  - Form: name, email, phone, password, confirmPassword
  - Validation đầy đủ
  - Gọi `authService.register()`

### Ngày 4-5: PrivateRoute + Navbar
- [ ] Hoàn thiện `PrivateRoute` trong router (redirect nếu chưa login)
- [ ] Tạo `Navbar.jsx` cơ bản:
  - Hiển thị tên user khi đã đăng nhập
  - Nút Logout
  - Menu điều hướng theo role
- [ ] Test toàn bộ auth flow

---

## 🔌 API Contract — Tuần 1

> ⚠️ Dev A phải hoàn thành phần này trước ngày 3 để Dev B có thể tích hợp

### POST `/api/v1/auth/register`
```json
// Request Body
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0901234567",
  "password": "123456"
}

// Response 201
{
  "success": true,
  "statusCode": 201,
  "message": "Đăng ký thành công",
  "data": {
    "user": { "_id": "...", "name": "...", "email": "...", "role": "khach_hang" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}

// Error 409 (email đã tồn tại)
{ "success": false, "statusCode": 409, "message": "Email đã được sử dụng" }
```

### POST `/api/v1/auth/login`
```json
// Request Body
{ "email": "user@example.com", "password": "123456" }

// Response 200
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "user": { "_id": "...", "name": "...", "email": "...", "role": "khach_hang" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}

// Error 401
{ "success": false, "statusCode": 401, "message": "Email hoặc mật khẩu không đúng" }
```

### GET `/api/v1/auth/me`
```
Headers: { Authorization: "Bearer <token>" }

// Response 200
{
  "success": true,
  "message": "Thông tin người dùng",
  "data": { "_id": "...", "name": "...", "email": "...", "role": "..." }
}
```

---

## ✅ Definition of Done (DoD)

Trước khi tạo PR merge vào `develop`, phải đảm bảo:
- [ ] Code chạy không có lỗi console
- [ ] Đã test manual các luồng chính
- [ ] Không có `console.log` debug còn sót
- [ ] Đặt tên biến, hàm rõ ràng bằng tiếng Anh hoặc camelCase
- [ ] Tất cả function phải dùng **arrow function syntax**

---

## 🚨 Điểm Cần Lưu Ý

> **Dev A**: Đảm bảo CORS được cấu hình đúng `origin: 'http://localhost:5173'`

> **Dev B**: Khi chưa có API thật, dùng mock data để test UI trước

> **Cả team**: Sync với nhau cuối ngày 2 để confirm API contract

---

## 📌 Branch & PR

```
Dev A: git checkout -b backend/week1-auth
Dev B: git checkout -b frontend/week1-auth-ui

# Tạo PR vào develop khi xong
# Title PR: [Week1] Backend - Auth API hoàn chỉnh
# Title PR: [Week1] Frontend - Login/Register UI hoàn chỉnh
```
