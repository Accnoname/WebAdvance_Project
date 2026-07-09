# Handoff Report — worker_voucher_backend_1

## 1. Observation
- **Duplicated Validation Logic**: The voucher validation logic was duplicated between `validateVoucher` in `backend/src/services/voucher.service.js` (lines 129-174) and `validateAndCalculateVoucher` in `backend/src/services/order.service.js` (lines 8-54).
- **Undefined discountValue Bug**: In `backend/src/tests/voucher_edge_cases.test.js`, test 5c failed because `discountValue` was missing/undefined, producing `NaN` for `discountAmount` and `finalAmount`.
- **Payment Increments**: Double increments occurred in `backend/src/services/payment.service.js` in both `confirmOfflinePayment` (lines 128-133) and `handleVNPayIPN` (lines 266-271) using the `updateOne` `$inc: { usedCount: 1 }` operation on payment confirmation instead of order reservation.
- **Unpaid Holds**: Orders in status `moi` with `isPaid = false` applying a voucher could block subsequent orders from using the voucher due to limits.
- **Voucher Tests**:
  - Running `node src/tests/voucher.test.js` verified the core logic.
  - Running `node src/tests/voucher_edge_cases.test.js` verified edge cases.
  - Custom test file `backend/src/tests/voucher_patterns.test.js` was created to verify the atomic reservation, cancellation rollbacks, and unpaid hold invalidation.

## 2. Logic Chain
- **DRY Unification**: By updating `validateVoucher` in `voucher.service.js` to accept `isExistingOrder` (default `false`) and using it to wrap all rules, we unified the logic. `OrderService` now calls `VoucherService.validateVoucher` directly, eliminating duplication.
- **Robustness against NaN**: Coercing `voucher.discountValue` to `0` if undefined or null, and defaulting `voucher.discountType` to `'fixed'`, completely avoids `NaN` math, fixing Test 5c.
- **Atomic Reservation & Rollback**:
  - Inside `OrderService.create`, we find the voucher and atomically increment `usedCount` using Mongoose `findOneAndUpdate` with filters `{ code, isAvailable: true, expiryDate: { $gt: now }, $or: [{ maxUses: null }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }] }`.
  - If it returns null, we throw `AppError('Mã giảm giá đã hết lượt sử dụng hoặc không khả dụng', 400)`.
  - If any subsequent operations in `OrderService.create` fail, the `catch` block performs rollback via `$inc: { usedCount: -1 }`.
  - In `OrderService.updateStatus`, if status changes to `'da_huy'`, we rollback the reservation via `$inc: { usedCount: -1 }`.
  - In `OrderService.updateItemStatus`, if cancelling an item results in total amount falling below `minOrderAmount`, we nullify the voucher and rollback the reservation via `$inc: { usedCount: -1 }`.
- **Remove Double Increment**: Removing the `usedCount` increment blocks from `confirmOfflinePayment` and `handleVNPayIPN` prevents double-counting, as reservation happens at order creation.
- **Prevent Locked Holds**: Before reserving a voucher in `OrderService.create`, we query existing unpaid orders (status `'moi'`, `isPaid: false`) matching the customer (or table if guest) that applied the same voucher. We call `OrderService.updateStatus(priorOrder._id, 'da_huy')` on them to invalidate them, which triggers rollback of the voucher, freeing up the reservation slot.

## 3. Caveats
- **Same Table association**: For guests, matching is based on the table ID. If two distinct guest groups sit at the same table (which is logically possible only sequentially if the table status is not updated properly), the second order creation will automatically cancel the first guest's unpaid order. This is the intended behavior specified in the request ("or the same table, if guest").

## 4. Conclusion
Milestones 1 and 2 are fully completed. Duplicate logic is unified, NaN edge-case failures are resolved, atomic reservation/rollback lifecycle is robustly implemented, double-increments are removed, and abandoned holds are prevented. All test suites pass successfully.

## 5. Verification Method
Verify that tests execute and output `PASS`/`SUCCESS` using these commands in the `backend` directory:
- Run main voucher tests:
  ```powershell
  node src/tests/voucher.test.js
  ```
- Run edge-case tests:
  ```powershell
  node src/tests/voucher_edge_cases.test.js
  ```
- Run atomic patterns & hold prevention tests:
  ```powershell
  node src/tests/voucher_patterns.test.js
  ```
- Run stress tests:
  ```powershell
  node src/tests/voucher.stress.js
  ```
- Run user verification tests:
  ```powershell
  node src/tests/user.test.js
  ```
