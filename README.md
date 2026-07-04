# 🍽️ Restaurant Management System

> A comprehensive Restaurant Management System developed as a final school project. It features real-time order tracking, role-based access control, and integrated online payments to deliver a complete dining management solution.

---

## ✨ Key Features

- **🔐 Role-Based Access Control (RBAC):** Secure authentication via JWT for Customers, Staff, and Managers.
- **⚡ Real-time Updates:** Instant order synchronization between customers and the kitchen using Socket.IO.
- **📱 Digital Menu & QR Ordering:** Customers can scan QR codes at their table to view the menu and place orders directly.
- **💳 Payment Integration:** Supports offline payments (cash/transfer) and online secure transactions via VNPay Sandbox.
- **📊 Manager Dashboard:** Visualizes revenue, popular dishes, and table utilization using responsive charts (Recharts).
- **🛡️ Data Security & Validation:** Request validation using Joi, secure password hashing with bcrypt, and comprehensive error handling.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Real-time:** Socket.IO
- **Security & Auth:** JWT, bcryptjs, Express Rate Limit
- **Uploads:** Multer (Local storage)

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS v3
- **State Management:** Zustand
- **Routing:** React Router v6
- **Charts:** Recharts
- **API Client:** Axios (with interceptors)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URL)

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
For testing purposes, please refer to the [Test Accounts Documentation](docs/TEST_ACCOUNTS.md) for the default Email and Password combinations for each role (Manager, Staff, Customer).

---

## 📁 Project Architecture

This repository uses a Monorepo structure, separating concerns cleanly between the API server and the Client UI.

```
restaurant-management/
├── backend/            # Express API Server (MVC + Repository pattern)
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── sockets/
│   └── uploads/        # Local image storage
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── services/
│   │   └── store/
└── docs/               # Technical documentation
```

---

*Developed for an Academic Presentation | 2026*
