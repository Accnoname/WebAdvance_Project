# 📋 TEAM WORKFLOW & CONVENTIONS

> Tài liệu nội bộ dành cho team phát triển.
> Chứa quy tắc làm việc, chia việc và git conventions.

---

## 👥 Phân Chia Vai Trò

| | Dev A (Backend) | Dev B (Frontend) |
|---|---|---|
| **Phụ trách** | Express API, MongoDB, Socket.IO, VNPay | React, Vite, Tailwind, Zustand, UI/UX |
| **Branch chính** | `backend/*` | `frontend/*` |

---

## 📅 Kế Hoạch Theo Tuần

| Tuần | File | Nội dung |
|------|------|----------|
| 1 | [WEEK1 — Auth & Setup](./WEEK1_Auth_Setup.md) | Khởi tạo dự án, Auth, JWT |
| 2 | [WEEK2 — Menu & Table](./WEEK2_Menu_Table.md) | CRUD Menu, Quản lý bàn, QR code |
| 3 | [WEEK3 — Order & Realtime](./WEEK3_Order_Realtime.md) | Đặt món, Socket.IO real-time |
| 4 | [WEEK4 — Payment VNPay](./WEEK4_Payment.md) | Thanh toán VNPay + offline |
| 5 | [WEEK5 — Report & Polish](./WEEK5_Report_Polish.md) | Báo cáo, validation, hoàn thiện |

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
