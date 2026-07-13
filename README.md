# 🍽️ Restaurant Management System — All-in-One Integrated F&B Platform

> A comprehensive, modern Restaurant Management System developed as a final academic project. It features real-time order tracking, role-based access control, a full-fledged kitchen interface, and integrated online payments to deliver a complete dining management solution.

![Restaurant Dashboard](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200&h=400)

---

## ✨ Key Features

- **🔐 Role-Based Access Control (RBAC):** Secure, stateless authentication via JWT. Distinct access levels for Customers, Kitchen/Staff, and Managers.
- **⚡ Real-time Updates:** Instant order synchronization between customer tables and the kitchen display using `Socket.IO`.
- **📱 Digital Menu & QR Ordering:** Customers can view the menu, select tables, and place orders directly from their devices.
- **💳 Payment Integration:** Supports offline payments (cash/transfer) and online secure transactions via **VNPay Sandbox** (with IPN Webhook support).
- **📊 Executive Dashboard:** Visualizes revenue, popular dishes, and table utilization using responsive charts (`Recharts`).
- **🛡️ Data Security & Validation:** Robust request validation using `Joi`, secure password hashing with `bcrypt`, and global error handling middleware.

---

## 🛠️ Technology Stack

### Backend (Monolithic API)
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Real-time:** Socket.IO
- **Security & Auth:** JWT, bcryptjs, Helmet, Express Rate Limit
- **Uploads:** Multer (Local storage)

### Frontend (Single Page Application)
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS v3
- **State Management:** Zustand (Cart & Auth stores)
- **Routing:** React Router v6
- **Charts & UI:** Recharts, Lucide-React, React-hot-toast
- **API Client:** Axios (with automatic token interceptors)

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local instance running on port 27017 or MongoDB Atlas URL)

### 2. Installation
Clone the repository and install dependencies for both frontend and backend:
```bash
git clone https://github.com/Accnoname/WebAdvance_Project.git
cd WebAdvance_Project

# Install all dependencies (Monorepo root script)
npm run install:all
```

### 3. Environment Setup
Configure the environment variables in `backend/.env` (refer to `backend/.env.example`):
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_db
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
VNPAY_TMN_CODE=your_sandbox_code
VNPAY_HASH_SECRET=your_sandbox_secret
```

### 4. Run the Application
Start both the backend server and frontend development server concurrently:
```bash
npm run dev
```
- **Backend API:** `http://localhost:3000`
- **Frontend App:** `http://localhost:5173`

### 5. Test Accounts
For testing purposes, please refer to the `docs/TEST_ACCOUNTS.md` for the default Email and Password combinations for each role (Manager, Staff, Customer).

---

## 📁 Project Architecture

This repository uses a Monorepo structure, separating concerns cleanly between the API server and the Client UI.

```text
restaurant-management/
├── backend/            # Express API Server (MVC + Service + Repository pattern)
│   ├── src/
│   │   ├── config/     # Database and Socket setups
│   │   ├── controllers/# Request handlers & Response formatting
│   │   ├── middlewares/# Auth, Validation, Error catching
│   │   ├── models/     # Mongoose Schemas
│   │   ├── repositories/# Data Access Layer (DAL)
│   │   ├── routes/     # Express routers
│   │   ├── services/   # Core Business Logic
│   │   └── utils/      # Helpers (VNPay, JWT)
│   └── uploads/        # Local image storage
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/ # Reusable UI pieces
│   │   ├── hooks/      # Custom React hooks (useSocket)
│   │   ├── pages/      # Route components (Customer, Staff, Manager)
│   │   ├── router/     # React Router config & Protected Routes
│   │   ├── services/   # Axios API calls
│   │   └── store/      # Zustand global state
└── docs/               # Technical documentation
```

---

*Developed for an Academic Presentation | 2026*
