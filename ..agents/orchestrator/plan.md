# Implementation Plan: Voucher/Coupon System

This plan outlines the steps required to design, implement, and verify the Voucher/Coupon system for the Restaurant Management System.

## Architecture & Database Schema
1. **Voucher Model (`backend/src/models/Voucher.model.js`)**:
   - `code`: Unique, uppercase string.
   - `discountType`: 'percentage' or 'fixed'.
   - `discountValue`: Positive number.
   - `minOrderAmount`: Minimum order value to apply the voucher.
   - `maxUses`: Maximum times the voucher can be used.
   - `usedCount`: Tracks how many times it has been used.
   - `expiryDate`: Date when the voucher expires.
   - `isAvailable`: Boolean flag to activate/deactivate the voucher.
2. **Order Model Update (`backend/src/models/Order.model.js`)**:
   - `voucherCode`: Reference/string of the voucher code used.
   - `discountAmount`: Amount subtracted from the total.
   - `finalAmount`: Total after discount.

## Milestones

### Milestone 1: Setup & Code Exploration
- **Objective**: Explore the codebase, verify database connectivity, confirm dependencies (like `react-hot-toast` and `lucide-react`), and prepare the detailed interface specifications.
- **Verification**: Output analysis report containing structure verification and proposed code changes.

### Milestone 2: Backend Implementation
- **Objective**: Create Mongoose Model, Repository, Service, Controller, and Routes for Vouchers. Update Order model, service, controller, and routes.
- **Tasks**:
  - Implement `Voucher.model.js`
  - Implement `voucher.repository.js`
  - Implement `voucher.service.js` (including CRUD and `validate(code, orderAmount)` business logic)
  - Implement `voucher.controller.js`
  - Implement `voucher.routes.js`
  - Update `Order.model.js` to store voucher info and final amount.
  - Update `OrderService.create` to validate and apply the voucher code, calculate the discount, and increment `usedCount`.
  - Add API endpoints to routes mapping.
- **Verification**: Run build and execute test requests to verify successful compiling/running.

### Milestone 3: Backend Testing & API Verification
- **Objective**: Run unit/integration tests or execution scripts to verify all business rules:
  - Valid voucher application.
  - Rejecting expired vouchers.
  - Rejecting vouchers that have reached `maxUses`.
  - Rejecting vouchers when order total is below `minOrderAmount`.
  - Verify that `usedCount` increments correctly on order creation.
- **Verification**: Handoff with detailed test execution output and verified response payloads.

### Milestone 4: Frontend Manager UI
- **Objective**: Create `/manager/vouchers` management view.
- **Tasks**:
  - Implement `/manager/vouchers` page using Tailwind CSS, Syne/DM Sans fonts, matching style guidelines.
  - Add table displaying: Code, Type, Value, Min Order, Exp Date, Used/Total Uses, Status.
  - Create Modal Form for Voucher Creation with fields: Code, Discount Type, Discount Value, Min Order, Max Uses, Expiry Date.
  - Integrate validation in modal form: Expiry Date in the future, value > 0.
  - Create a Toggle/Delete button to hide or delete vouchers.
  - Add routes and link in `ManagerLayout.jsx` with a Lucide `Ticket` icon.
- **Verification**: Compile with `npm run build` in the `frontend` directory.

### Milestone 5: Frontend POS & Customer Integration
- **Objective**: Integrate voucher input and calculation in POS page and customer payment page.
- **Tasks**:
  - Add Voucher Code input field on `POSPage.jsx`. Validate voucher code using API, display discount amount, adjust summary totals before checkout.
  - Update `TablesPage.jsx` Checkout Modal to support entering voucher codes during checkout.
  - Replace the mock validation in `PaymentPage.jsx` with real API calls to `/api/v1/vouchers/validate/:code`.
- **Verification**: Complete end-to-end check of checkout and order flows, ensuring that frontend correctly handles errors via `react-hot-toast`.

### Milestone 6: Reviews, Challenges, and Audits
- **Objective**: Subject implementation to rigorous reviews and integrity audits.
  - Verification of layout guidelines in `rule_frontend.md` and `AGENTS.md`.
  - Run `teamwork_preview_auditor` to check for integrity violations.
- **Verification**: Audit verdict clean, all reviewer approvals.
