# Handoff Report — Voucher, Payment, and Cart Investigation

This handoff contains the read-only analysis of the voucher application, checkout (VNPay & offline), and cart system.

---

## 1. Observation

During the exploration of the codebase at `d:\Web Nhà Hàng`, the following specifics were observed:

### 1.1. Model Schemas
- **Voucher Model** (`backend/src/models/Voucher.model.js`):
  - Defines `discountType` as an enum of `['percentage', 'fixed']`.
  - Defines `minOrderAmount` (not `minOrderValue`), `maxUses`, `usedCount`, and `expiryDate`.
- **Order Model** (`backend/src/models/Order.model.js`):
  - Defines `voucherCode`, `discountAmount`, and `finalAmount`.
  - Items are snapshotted with their current `price` to freeze item cost at checkout.

### 1.2. Backend Logic Duplication
- Voucher validation is duplicated in two separate files:
  1. `validateVoucher` in `backend/src/services/voucher.service.js` (lines 129–174)
  2. `validateAndCalculateVoucher` in `backend/src/services/order.service.js` (lines 8–54)

### 1.3. Double-Use & Race Conditions
- In `backend/src/services/order.service.js` (lines 159-164), when an order is created, it calls `validateAndCalculateVoucher` to verify voucher validity. However, it does not update the voucher's `usedCount`.
- The increment of `usedCount` only occurs during payment confirmation:
  - In `backend/src/services/payment.service.js` line 129 (`confirmOfflinePayment`):
    ```javascript
    if (order.voucherCode) {
      await Voucher.updateOne(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }
    ```
  - In `backend/src/services/payment.service.js` line 267 (`handleVNPayIPN`):
    ```javascript
    if (order.voucherCode) {
      await Voucher.updateOne(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }
    ```
- Running `node src/tests/voucher.test.js` verifies that `usedCount` is not incremented at order checkout, returning:
  ```
  Voucher usedCount after payment: 0
  Voucher usedCount increment check: FAIL
  ```

### 1.4. Backend Robustness / Bug
- In `backend/src/tests/voucher_edge_cases.test.js`, running the test suite returns:
  ```
  - Test 5c: discountValue is missing/undefined
  Result of validateVoucher: { voucherCode: 'MISSING_VAL', discountAmount: NaN, finalAmount: NaN }
  Result: FAIL (validateVoucher returned NaN values!)
  ```
  This is due to `Math.min(undefined, orderAmount)` yielding `NaN` during calculation.

### 1.5. Frontend UI Bugs
- In `frontend/src/components/VoucherSelectorModal.jsx` lines 87 and 104, the check is written as:
  ```javascript
  voucher.discountType === 'percent' ? '%' : '₫'
  ```
  Since the backend enum is `'percentage'` (not `'percent'`), this check always fails, displaying percentage discounts as currency `₫` on the client.
- In `frontend/src/pages/customer/CartPage.jsx` lines 503-510, selected vouchers trigger validation through a `setTimeout` programmatic click on the DOM:
  ```javascript
  setTimeout(() => {
    const btn = document.getElementById('btn-apply-voucher');
    if (btn) btn.click();
  }, 100);
  ```

---

## 2. Logic Chain

1. **Vulnerability to Double-Use**: Because `usedCount` is only incremented on successful payment, the voucher is considered "available" (i.e. `usedCount < maxUses`) for any checkout attempt made between order placement and payment. Multiple customers (or the same customer) can place separate orders using the same single-use voucher code.
2. **Blind Increments**: When those pending orders are paid, the backend updates the voucher using `updateOne({ code }, { $inc: { usedCount: 1 } })` without checking the current `usedCount` limits again, leading to `usedCount` exceeding `maxUses`.
3. **No Rollback on Cancel**: If an order that used a voucher is paid (incrementing `usedCount`) and subsequently cancelled (`orderStatus = 'da_huy'`), `updateStatus` in `order.service.js` fails to decrement `usedCount`, permanently wasting the voucher slot.
4. **Incorrect Display of Vouchers**: Because the backend value `'percentage'` does not match the frontend check `'percent'`, the UI displays `%` discounts using the currency `₫` symbol (e.g., "Giảm 10₫" instead of "Giảm 10%").
5. **DOM click fragility**: The reliance on `document.getElementById('btn-apply-voucher').click()` in React is highly fragile and prone to runtime bugs if the DOM structure changes or if rendering is delayed beyond 100ms.

---

## 3. Caveats

- Investigation is based on read-only static analysis and local test execution.
- We assume that the database connection configuration is stable and matches the local environment test results.

---

## 4. Conclusion

The voucher and checkout system has several critical flaws:
1. **Security/Logic Vulnerability**: Lack of atomic checks/reservations at checkout allows bypass of `maxUses` on vouchers.
2. **Missing Rollback**: Cancelled paid orders do not restore voucher usage counts.
3. **Robustness Issues**: Undefined discount values in the database result in NaN calculations, causing database state corruption.
4. **UI Errors**: Typo in the discount type comparison displays percent-based vouchers as currency discounts, and a fragile DOM click simulation is used to apply vouchers from the selector modal.

**Actionable Recommendations:**
- Merge the duplicate validate logic into a single service method.
- Implement **Reservation Pattern** with TTL at checkout (using Mongoose transactions or atomic check-and-increment conditional queries).
- Update the cancellation service logic to decrement `usedCount` when restoring orders.
- Fix the frontend typo (`'percent'` -> `'percentage'`) and replace the programmatic click event with a direct function call.

---

## 5. Verification Method

To independently verify the observations:
1. Run the test suite:
   ```bash
   cd backend
   node src/tests/voucher.test.js
   node src/tests/voucher_edge_cases.test.js
   ```
2. Verify the test results:
   - `voucher.test.js` will output `Voucher usedCount increment check: FAIL`.
   - `voucher_edge_cases.test.js` will exit with code 1 and show `Result: FAIL (validateVoucher returned NaN values!)` for Test 5c.
3. Check the code logic files:
   - Check `backend/src/services/payment.service.js` line 129 and 267 to confirm the blind `$inc` on payment.
   - Check `frontend/src/components/VoucherSelectorModal.jsx` line 87 to inspect the typo `'percent'`.
