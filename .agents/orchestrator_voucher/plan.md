# Plan: Voucher Optimization and Payment Workflow

## Objective
Implement robust voucher application, prevent race conditions during checkout/payments, fix frontend styling/symbol issues, and refactor direct application of vouchers.

## Milestones
1. **Milestone 1: Backend Robustness & DRY**
   - Unify voucher validation into a single helper in `voucher.service.js` and call it from `order.service.js`.
   - Prevent crash/NaN when `discountValue` is undefined.
   - Run tests to confirm.
2. **Milestone 2: Concurrency & Rollback (Reservation Pattern)**
   - Implement atomic checking and reservation of vouchers on order creation.
   - Remove double-increment of voucher `usedCount` from payment services (`payment.service.js`).
   - Implement decrement of voucher `usedCount` on order cancellation (`da_huy`).
   - Implement auto-cancellation of unpaid orders utilizing the same voucher by the same customer/table to prevent holding the voucher.
   - Run concurrency stress tests to verify.
3. **Milestone 3: Frontend UI/UX Fixes**
   - Fix `discountType === 'percent'` check in `VoucherSelectorModal.jsx` to check for `'percentage'`.
   - Refactor `CartPage.jsx` to call the voucher application logic directly instead of simulating a button click in DOM.
4. **Milestone 4: End-to-End Testing & Verification**
   - Create E2E test script covering Tier 1-4 tests.
   - Verify all tests pass.
   - Run Forensic Auditor to certify integrity.

## Subagent Dispatch Plan
- **Worker 1 (Backend)**: Handle Milestones 1 & 2.
- **Worker 2 (Frontend)**: Handle Milestone 3.
- **Worker 3 (E2E Tests)**: Handle Milestone 4.
- **Reviewer**: Verify each milestone.
- **Auditor**: Run forensic integrity checks.
