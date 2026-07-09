# Project: Voucher Optimization and Payment Workflow

## Architecture
This project optimizes the existing Voucher/Coupon subsystem and payment integration.
- **Backend Components**:
  - `backend/src/services/voucher.service.js`: Shared validation logic, atomic voucher checking.
  - `backend/src/services/order.service.js`: Order creation with Reservation Pattern, rollback on cancel.
  - `backend/src/services/payment.service.js`: Removed redundant increment logic.
- **Frontend Components**:
  - `frontend/src/components/VoucherSelectorModal.jsx`: Corrected discountType checking.
  - `frontend/src/pages/customer/CartPage.jsx`: Direct invocation of applyVoucher handler.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | DRY Unification & Bug Fixes | Unify backend validation, handle undefined discountValue | None | PLANNED |
| M2 | Race Condition Prevention | Reservation pattern at order creation, rollback on cancel, cleanup of old unpaid voucher reservations | M1 | PLANNED |
| M3 | Frontend UI & UX Fixes | Fix percent display in modal, direct applyVoucher call | M2 | PLANNED |
| M4 | Verification & Hardening | Opaque-box E2E testing, Challenger, Auditor | M3 | PLANNED |

## Code Layout
- Backend Services: `backend/src/services/`
- Backend Models: `backend/src/models/`
- Frontend Components: `frontend/src/components/`
- Frontend Pages: `frontend/src/pages/`

## Interface Contracts
### `POST /api/v1/vouchers/validate`
- **Request**: `{ "code": "PERCENT10", "orderAmount": 150000 }`
- **Response**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Voucher hợp lệ",
    "data": {
      "voucherCode": "PERCENT10",
      "discountAmount": 15000,
      "finalAmount": 135000
    }
  }
  ```
