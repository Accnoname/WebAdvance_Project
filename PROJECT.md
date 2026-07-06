# Project: Restaurant Management System — Voucher/Coupon System

## Architecture
This project extends the Restaurant Management System by adding a new Voucher/Coupon subsystem.
- **Backend Components**:
  - `Voucher.model.js` (MongoDB Voucher Schema)
  - `voucher.repository.js` (Voucher database access, using callback pattern)
  - `voucher.service.js` (Voucher validation and calculation logic)
  - `voucher.controller.js` (Express API endpoints controller)
  - `voucher.routes.js` (Voucher REST endpoints)
- **Frontend Components**:
  - `VoucherManagePage.jsx` (Manager UI)
  - `voucher.service.js` (API communication layer)
  - Updated `POSPage.jsx`, `TablesPage.jsx`, and `PaymentPage.jsx` for validation integration.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Exploration | Exploration and design specification | None | DONE |
| M2 | Backend API | CRUD operations for Vouchers and validation logic | M1 | IN_PROGRESS |
| M3 | POS & Payment | Apply vouchers during Order creation and POS validation | M2 | PLANNED |
| M4 | Manager UI | Vouchers list and creation modal | M3 | PLANNED |
| M5 | End-to-End Test | Verification and Adversarial Hardening | M4 | PLANNED |

## Code Layout
- Backend Models: `backend/src/models/`
- Backend Repositories: `backend/src/repositories/`
- Backend Services: `backend/src/services/`
- Backend Controllers: `backend/src/controllers/`
- Backend Routes: `backend/src/routes/`
- Frontend Pages: `frontend/src/pages/`
- Frontend Services: `frontend/src/services/`

## Interface Contracts

### 1. Backend RESTful Voucher APIs
#### `POST /api/v1/vouchers` (Role: `quan_ly`)
- **Request Body**:
  ```json
  {
    "code": "GIAM20K",
    "discountType": "fixed",
    "discountValue": 20000,
    "minOrderAmount": 100000,
    "maxUses": 50,
    "expiryDate": "2026-12-31T23:59:59.000Z"
  }
  ```
- **Response**: standard success payload containing the created voucher object.

#### `GET /api/v1/vouchers` (Role: `quan_ly`)
- **Response**: standard success payload containing array of vouchers.

#### `GET /api/v1/vouchers/validate/:code` (Role: `khach_hang`, `nhan_vien`, `quan_ly`)
- **Query Params**: `orderAmount` (optional, to validate minOrderAmount)
- **Response**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Voucher hợp lệ",
    "data": {
      "code": "GIAM20K",
      "discountType": "fixed",
      "discountValue": 20000,
      "minOrderAmount": 100000
    }
  }
  ```

#### `DELETE /api/v1/vouchers/:id` (Role: `quan_ly`)
- Soft deletes / toggles availability.

### 2. Order Schema Extensions
- `voucherCode`: `String` (optional)
- `discountAmount`: `Number` (default 0)
- `finalAmount`: `Number` (required)

### 3. Socket.IO events
- `voucher:created`: notifies client that a new voucher is created (optional)
