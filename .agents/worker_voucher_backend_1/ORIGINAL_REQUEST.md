## 2026-07-09T15:54:28Z

Implement Milestones 1 and 2 of the Voucher Optimization backend project. Your goals:

1. **DRY Unification**: Unify the voucher validation logic. Currently, `validateVoucher` in `backend/src/services/voucher.service.js` and `validateAndCalculateVoucher` in `backend/src/services/order.service.js` are duplicated. Move the logic completely into `voucher.service.js` and have `order.service.js` call it. Ensure it handles all rules (expiry, availability, minOrderAmount, maxUses).
2. **Robustness & Crash/NaN Fix**: Resolve the issue where `discountValue` being undefined (as shown in Test 5c) causes NaN calculations for discountAmount and finalAmount. Safely handle undefined/missing value by treating it as 0 or throwing a clear validation error.
3. **Atomic Reservation Pattern**:
   - When creating an order (`OrderService.create` in `backend/src/services/order.service.js`), atomically reserve the voucher by incrementing its `usedCount` only if it hasn't reached `maxUses`. Use Mongoose `findOneAndUpdate` with query conditions (`code`, `isAvailable`, `expiryDate` check, and `usedCount < maxUses`) to do this atomically.
   - If the update fails (returns null), throw an error ("Mã giảm giá đã hết lượt sử dụng hoặc không khả dụng").
   - If the order fails to save or create after reservation, rollback the reservation by decrementing the voucher's `usedCount` (using `$inc: { usedCount: -1 }`).
4. **Remove Double Increment**: Remove the blind `usedCount` increment logic from `payment.service.js` (`confirmOfflinePayment` and `handleVNPayIPN`) because the voucher is now reserved on order creation.
5. **Rollback on Cancel**: In `updateStatus` in `order.service.js`, if the new status is `da_huy` and the order has a `voucherCode` applied, decrement the voucher's `usedCount` by 1.
6. **Prevent Locked/Abandoned Voucher Holds**: In order creation, before reserving a voucher, check if the same customer (or the same table, if guest) has any existing unpaid orders (status `moi` and `isPaid = false`) that used this voucher. If so, automatically update those prior unpaid orders' status to `da_huy` (which will trigger decrement of the voucher usedCount, freeing up the reservation) before applying it to the new order.
7. **Verification**: Verify that the changes compile and run by running the backend tests (e.g. using `npm run test` or `npx jest` in the backend directory). Make sure you run `backend/src/tests/voucher.test.js` or any other relevant voucher/payment tests and document the results.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your working directory is d:\Web Nhà Hàng\agents\worker_voucher_backend_1. Write a handoff.md reporting details of your changes and test verification results.
