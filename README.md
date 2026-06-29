# 🍽️ Restaurant Management System

> **Full-Stack**: Express.js + MongoDB + React.js + Vite + Tailwind CSS  
> **Team**: 2 người | **Thời gian**: 5 tuần

---

---

## 📅 Kế Hoạch Theo Tuần

| Tuần | File | Nội dung |
|------|------|----------|
| 1 | [WEEK1 — Auth & Setup](./docs/WEEK1_Auth_Setup.md) | Khởi tạo dự án, Auth, JWT |
| 2 | [WEEK2 — Menu & Table](./docs/WEEK2_Menu_Table.md) | CRUD Menu, Quản lý bàn, QR code |
| 3 | [WEEK3 — Order & Realtime](./docs/WEEK3_Order_Realtime.md) | Đặt món, Socket.IO real-time |
| 4 | [WEEK4 — Payment VNPay](./docs/WEEK4_Payment.md) | Thanh toán VNPay + offline |
| 5 | [WEEK5 — Report & Polish](./docs/WEEK5_Report_Polish.md) | Báo cáo, validation, hoàn thiện |

---

## 🌿 Git Branch Convention

```
main                    ← production (chỉ merge khi hoàn thành tuần)
├── develop             ← integration branch (merge PR vào đây)
├── backend/week1-auth  ← Dev A làm
└── frontend/week1-auth ← Dev B làm
```

### Quy tắc đặt tên branch
```
backend/<tuần>-<tên-feature>
frontend/<tuần>-<tên-feature>

Ví dụ:
  backend/week1-auth
  frontend/week1-login-page
  backend/week2-menu-crud
  frontend/week2-menu-ui
```

---

## 📝 Commit Message Convention

```
<type>(<scope>): <mô tả ngắn gọn>

type:
  feat     → thêm tính năng mới
  fix      → sửa bug
  refactor → cải thiện code không đổi tính năng
  docs     → cập nhật tài liệu
  style    → format code, CSS
  test     → thêm test

Ví dụ:
  feat(auth): add JWT middleware verifyToken
  fix(order): fix totalAmount calculation
  feat(ui): implement LoginPage with react-hook-form
  docs(week2): update API contract for menu endpoints
```

---

## 🔄 Quy Trình Làm Việc

```
1. Kéo task mới từ file WEEK*.md
2. Tạo branch mới từ develop
3. Code + test local
4. Push branch → tạo Pull Request vào develop
5. Người còn lại review PR (ít nhất 1 comment/approval)
6. Merge sau khi approved
```

---

## 🚀 Khởi Động Project

```bash
# Clone và cài dependencies
git clone <repo-url>
npm run install:all

# Chạy development (cả backend + frontend)
npm run dev

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

---

## 📁 Cấu Trúc Thư Mục

```
restaurant-management/
├── backend/            # Express API
├── frontend/           # React App
├── docs/               # Tài liệu kế hoạch theo tuần
│   ├── WEEK1_Auth_Setup.md
│   ├── WEEK2_Menu_Table.md
│   ├── WEEK3_Order_Realtime.md
│   ├── WEEK4_Payment.md
│   └── WEEK5_Report_Polish.md
├── .agents/
│   └── AGENTS.md       # Luật code cho AI agent
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## 📌 Links Quan Trọng

- 📋 [Implementation Plan đầy đủ](./IMPLEMENTATION_PLAN.md)
- 🤖 [Coding Rules & Conventions](./.agents/AGENTS.md)
- 🌐 API Base URL: `http://localhost:3000/api/v1`
- 💻 Frontend URL: `http://localhost:5173`
