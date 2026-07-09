## Forensic Audit Report

**Work Product**: Voucher System Modifications (Backend & Frontend)
**Profile**: General Project
**Verdict**: CLEAN

### Phase Results
- **Atomic Reservation & Limit Enforcement Check**: PASS — Verified the implementation in `backend/src/services/order.service.js` which uses Mongoose's `findOneAndUpdate` atomic check-and-increment operation with `$inc: { usedCount: 1 }` and checking condition `{ $expr: { $lt: ["$usedCount", "$maxUses"] } }` to ensure concurrency limits are enforced at the database level.
- **DRY Validation Check**: PASS — Verified that voucher validation in `backend/src/services/order.service.js` correctly delegates calculations to `VoucherService.validateVoucher`, removing duplicated validation code.
- **NaN Prevention Check**: PASS — Verified that in `backend/src/services/voucher.service.js`, missing/null `discountValue` or `discountType` are safely coerced to default values, and missing/null `expiryDate` throws a handled error instead of causing NaN or database corruption.
- **Order Cancellation Rollback Check**: PASS — Verified that if order creation fails (in `OrderService.create`), the voucher reservation is rolled back using `Voucher.updateOne` with `{ $inc: { usedCount: -1 } }`. Similarly, if an order is cancelled (`orderStatus` set to `'da_huy'`), or if an item cancellation drops the order total below `minOrderAmount`, the voucher usedCount is decremented appropriately.
- **Prior Unpaid Order Cancellation Check**: PASS — Verified that `OrderService.create` queries and cancels prior unpaid orders holding the same voucher for the customer/table, freeing up the voucher capacity and preventing deadlock locks/holds.
- **Frontend Display Correction**: PASS — Verified that `frontend/src/components/VoucherSelectorModal.jsx` has been updated to check for `voucher.discountType === 'percentage'` instead of `'percent'`, resolving the visual display issue.
- **Frontend Action Invocation**: PASS — Verified that the simulated click logic using `document.getElementById('btn-apply-voucher').click()` in `frontend/src/pages/customer/CartPage.jsx` has been refactored into a direct function invocation `handleApplyVoucher(code)`.
- **Backend Tests Execution**: PASS — Ran all 4 test scripts (`voucher.test.js`, `voucher_edge_cases.test.js`, `voucher_patterns.test.js`, and `voucher.stress.js`) successfully. All assertions passed.
- **Frontend Build Verification**: PASS — Successfully compiled the frontend project using `npm run build` with Vite.

---

### Evidence

#### 1. Source Code Diffs

##### Backend Voucher Service (`git diff backend/src/services/voucher.service.js`)
```diff
diff --git a/backend/src/services/voucher.service.js b/backend/src/services/voucher.service.js
index 5013294..e52f601 100644
--- a/backend/src/services/voucher.service.js
+++ b/backend/src/services/voucher.service.js
@@ -126,7 +126,7 @@ const remove = async (id) => {
   return deleted;
 };
 
-const validateVoucher = async (code, orderAmount) => {
+const validateVoucher = async (code, orderAmount, isExistingOrder = false) => {
   const voucher = await new Promise((resolve, reject) => {
     VoucherRepository.findByCode(code, (err, doc) => {
       if (err) return reject(err);
@@ -142,13 +142,18 @@ const validateVoucher = async (code, orderAmount) => {
     throw new AppError('Mã giảm giá hiện không khả dụng', 400);
   }
 
-  const now = new Date();
-  if (now > new Date(voucher.expiryDate)) {
-    throw new AppError('Mã giảm giá đã hết hạn sử dụng', 400);
-  }
+  if (!isExistingOrder) {
+    if (!voucher.expiryDate || isNaN(new Date(voucher.expiryDate).getTime())) {
+      throw new AppError('Mã giảm giá đã hết hạn sử dụng', 400);
+    }
+    const now = new Date();
+    if (now > new Date(voucher.expiryDate)) {
+      throw new AppError('Mã giảm giá đã hết hạn sử dụng', 400);
+    }
 
-  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
-    throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
+    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
+      throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
+    }
   }
 
   if (orderAmount < voucher.minOrderAmount) {
@@ -156,10 +161,13 @@ const validateVoucher = async (code, orderAmount) => {
   }
 
   let discountAmount = 0;
-  if (voucher.discountType === 'percentage') {
-    discountAmount = Math.floor(orderAmount * (voucher.discountValue / 100));
-  } else if (voucher.discountType === 'fixed') {
-    discountAmount = voucher.discountValue;
+  const discountValue = (voucher.discountValue !== undefined && voucher.discountValue !== null) ? voucher.discountValue : 0;
+  const discountType = voucher.discountType || 'fixed';
+
+  if (discountType === 'percentage') {
+    discountAmount = Math.floor(orderAmount * (discountValue / 100));
+  } else if (discountType === 'fixed') {
+    discountAmount = discountValue;
   }
 
   // Capped at orderAmount, cannot be negative
```

##### Backend Order Service (`git diff backend/src/services/order.service.js`)
```diff
diff --git a/backend/src/services/order.service.js b/backend/src/services/order.service.js
index e2bc6e4..09d170f 100644
--- a/backend/src/services/order.service.js
+++ b/backend/src/services/order.service.js
@@ -4,53 +4,13 @@ const MenuItem = require('../models/MenuItem.model');
 const Voucher = require('../models/Voucher.model');
 const { getIO } = require('../config/socket');
 const { AppError } = require('../middlewares/error.middleware');
+const VoucherService = require('./voucher.service');
 
 const validateAndCalculateVoucher = async (voucherCode, subTotal, isExistingOrder = false) => {
   if (!voucherCode) {
     return { voucherCode: null, discountAmount: 0, finalAmount: subTotal };
   }
-
-  const uppercaseCode = voucherCode.toUpperCase();
-  const voucher = await Voucher.findOne({ code: uppercaseCode });
-
-  if (!voucher) {
-    throw new AppError('Mã giảm giá không tồn tại', 404);
-  }
-
-  if (!voucher.isAvailable) {
-    throw new AppError('Mã giảm giá hiện không khả dụng', 400);
-  }
-
-  if (!isExistingOrder) {
-    const now = new Date();
-    if (now > new Date(voucher.expiryDate)) {
-      throw new AppError('Mã giảm giá đã hết hạn sử dụng', 400);
-    }
-
-    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
-      throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
-    }
-  }
-
-  if (subTotal < voucher.minOrderAmount) {
-    throw new AppError(`Đơn hàng tối thiểu phải từ ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này`, 400);
-  }
-
-  let discountAmount = 0;
-  if (voucher.discountType === 'percentage') {
-    discountAmount = Math.floor(subTotal * (voucher.discountValue / 100));
-  } else if (voucher.discountType === 'fixed') {
-    discountAmount = voucher.discountValue;
-  }
-
-  discountAmount = Math.max(0, Math.min(discountAmount, subTotal));
-  const finalAmount = subTotal - discountAmount;
-
-  return {
-    voucherCode: voucher.code,
-    discountAmount,
-    finalAmount
-  };
+  return await VoucherService.validateVoucher(voucherCode, subTotal, isExistingOrder);
 };
 
 const OrderService = {
@@ -156,53 +116,105 @@ const OrderService = {
     let discountAmount = 0;
     let finalAmount = totalAmount;
 
-    if (data.voucherCode) {
-      const voucherCalc = await validateAndCalculateVoucher(data.voucherCode, totalAmount, false);
-      voucherCode = voucherCalc.voucherCode;
-      discountAmount = voucherCalc.discountAmount;
-      finalAmount = voucherCalc.finalAmount;
-    }
+    let reservedVoucherCode = null;
+
+    try {
+      if (data.voucherCode) {
+        const uppercaseCode = data.voucherCode.toUpperCase();
+        const unpaidQuery = {
+          voucherCode: uppercaseCode,
+          orderStatus: 'moi',
+          isPaid: false
+        };
+
+        if (user && user.role === 'khach_hang') {
+          unpaidQuery.customer = user._id;
+        } else if (table) {
+          unpaidQuery.table = table._id;
+        }
 
-    const order = new Order({
-      orderType: data.orderType || 'tai_ban',
-      table: table ? table._id : null,
-      deliveryAddress: data.deliveryAddress || null,
-      deliveryPhone: data.deliveryPhone || null,
-      customer: user?.role === 'khach_hang' ? user._id : null,
-      orderedBy: user ? user._id : null,
-      items: processedItems,
-      totalAmount,
-      voucherCode,
-      discountAmount,
-      finalAmount,
-      note: data.note || ''
-    });
+        if (unpaidQuery.customer || unpaidQuery.table) {
+          const priorUnpaidOrders = await Order.find(unpaidQuery);
+          for (const priorOrder of priorUnpaidOrders) {
+            await OrderService.updateStatus(priorOrder._id, 'da_huy');
+          }
+        }
 
-    await order.save();
+        const voucherCalc = await validateAndCalculateVoucher(data.voucherCode, totalAmount, false);
+        voucherCode = voucherCalc.voucherCode;
+        discountAmount = voucherCalc.discountAmount;
+        finalAmount = voucherCalc.finalAmount;
+
+        const now = new Date();
+        const updatedVoucher = await Voucher.findOneAndUpdate(
+          {
+            code: uppercaseCode,
+            isAvailable: true,
+            expiryDate: { $gt: now },
+            $or: [
+              { maxUses: null },
+              { $expr: { $lt: ["$usedCount", "$maxUses"] } }
+            ]
+          },
+          { $inc: { usedCount: 1 } },
+          { new: true }
+        );
+
+        if (!updatedVoucher) {
+          throw new AppError('Mã giảm giá đã hết lượt sử dụng hoặc không khả dụng', 400);
+        }
+        reservedVoucherCode = voucherCode;
+      }
 
-    // Update table status
-    if (table && (table.status === 'trong' || table.status === 'dat_truoc')) {
-      table.status = 'dang_phuc_vu';
-      table.currentOrder = order._id;
-      await table.save();
-    }
+      const order = new Order({
+        orderType: data.orderType || 'tai_ban',
+        table: table ? table._id : null,
+        deliveryAddress: data.deliveryAddress || null,
+        deliveryPhone: data.deliveryPhone || null,
+        customer: user?.role === 'khach_hang' ? user._id : null,
+        orderedBy: user ? user._id : null,
+        items: processedItems,
+        totalAmount,
+        voucherCode,
+        discountAmount,
+        finalAmount,
+        note: data.note || ''
+      });
 
-    // Populate for socket
-    await order.populate('table');
-    await order.populate('items.menuItem');
-    await order.populate('customer', 'name');
+      await order.save();
 
-    // Emit socket events
-    const io = getIO();
-    if (io) {
-      io.to('kitchen').emit('order:new', order);
-      io.to('staff').emit('order:new', order);
-      if (table) {
-        io.to('staff').emit('table:status-changed', { tableId: table._id, status: table.status });
+      // Update table status
+      if (table && (table.status === 'trong' || table.status === 'dat_truoc')) {
+        table.status = 'dang_phuc_vu';
+        table.currentOrder = order._id;
+        await table.save();
       }
-    }
 
-    return order;
+      // Populate for socket
+      await order.populate('table');
+      await order.populate('items.menuItem');
+      await order.populate('customer', 'name');
+
+      // Emit socket events
+      const io = getIO();
+      if (io) {
+        io.to('kitchen').emit('order:new', order);
+        io.to('staff').emit('order:new', order);
+        if (table) {
+          io.to('staff').emit('table:status-changed', { tableId: table._id, status: table.status });
+        }
+      }
+
+      return order;
+    } catch (error) {
+      if (reservedVoucherCode) {
+        await Voucher.updateOne(
+          { code: reservedVoucherCode.toUpperCase() },
+          { $inc: { usedCount: -1 } }
+        );
+      }
+      throw error;
+    }
   },
 
   addItems: async (orderId, newItems) => {
@@ -269,6 +281,13 @@ const OrderService = {
     // [C1] Lưu tableId TRƯỚC khi có thể bị reset về null
     const tableId = order.table?._id || order.table || null;
 
+    if (orderStatus === 'da_huy' && order.orderStatus !== 'da_huy' && order.voucherCode) {
+      await Voucher.updateOne(
+        { code: order.voucherCode.toUpperCase() },
+        { $inc: { usedCount: -1 } }
+      );
+    }
+
     order.orderStatus = orderStatus;
 
     // Nếu hoàn thành hoặc hủy → giải phóng bàn
@@ -338,6 +357,10 @@ const OrderService = {
           order.voucherCode = null;
           order.discountAmount = 0;
           order.finalAmount = order.totalAmount;
+          await Voucher.updateOne(
+            { code: voucher.code },
+            { $inc: { usedCount: -1 } }
+          );
         } else if (voucher) {
           let discountAmount = 0;
           if (voucher.discountType === 'percentage') {
```

##### Backend Payment Service (`git diff backend/src/services/payment.service.js`)
```diff
diff --git a/backend/src/services/payment.service.js b/backend/src/services/payment.service.js
index 7d0fe47..132431e 100644
--- a/backend/src/services/payment.service.js
+++ b/backend/src/services/payment.service.js
@@ -125,13 +125,6 @@ const confirmOfflinePayment = async (orderId, processedBy, method = 'tien_mat')
   order.paymentMethod = method;
   await order.save();
 
-  if (order.voucherCode) {
-    await Voucher.updateOne(
-      { code: order.voucherCode.toUpperCase() },
-      { $inc: { usedCount: 1 } }
-    );
-  }
-
   const io = getIO();
   if (io) {
     io.to('staff').emit('payment:success', {
@@ -263,13 +256,6 @@ const handleVNPayIPN = async (vnpayData) => {
   if (isSuccess) {
     await Order.findByIdAndUpdate(orderId, { isPaid: true });
 
-    if (order.voucherCode) {
-      await Voucher.updateOne(
-        { code: order.voucherCode.toUpperCase() },
-        { $inc: { usedCount: 1 } }
-      );
-    }
-
     const io = getIO();
     if (io) {
       const freshOrder = await Order.findById(orderId);
```

##### Frontend Voucher Selector Modal (`git diff frontend/src/components/VoucherSelectorModal.jsx`)
```diff
diff --git a/frontend/src/components/VoucherSelectorModal.jsx b/frontend/src/components/VoucherSelectorModal.jsx
index ea921e3..e6057a2 100644
--- a/frontend/src/components/VoucherSelectorModal.jsx
+++ b/frontend/src/components/VoucherSelectorModal.jsx
@@ -84,7 +84,7 @@ const VoucherSelectorModal = ({ isOpen, onClose, onSelectVoucher, cartTotal }) =
                       ${isEligible ? 'bg-primary-50 text-primary-600' : 'bg-stone-200 text-stone-400'}
                     `}>
                       <span className="text-2xl font-black">
-                        {voucher.discountType === 'percent' ? '%' : '₫'}
+                        {voucher.discountType === 'percentage' ? '%' : '₫'}
                       </span>
                     </div>
 
@@ -101,7 +101,7 @@ const VoucherSelectorModal = ({ isOpen, onClose, onSelectVoucher, cartTotal }) =
                       <div className={`font-bold text-sm mb-1
                         ${isEligible ? 'text-primary-600' : 'text-stone-500'}
                       `}>
-                        Giảm {voucher.discountType === 'percent' 
+                        Giảm {voucher.discountType === 'percentage' 
                           ? `${voucher.discountValue}%` 
                           : formatCurrency(voucher.discountValue)}
                       </div>
```

##### Frontend Cart Page (`git diff frontend/src/pages/customer/CartPage.jsx`)
```diff
diff --git a/frontend/src/pages/customer/CartPage.jsx b/frontend/src/pages/customer/CartPage.jsx
index 6c3be30..6827204 100644
--- a/frontend/src/pages/customer/CartPage.jsx
+++ b/frontend/src/pages/customer/CartPage.jsx
@@ -128,14 +128,15 @@ const CartPage = () => {
     }
   };
 
-  const handleApplyVoucher = async () => {
-    if (!inputVoucher.trim()) {
+  const handleApplyVoucher = async (code) => {
+    const voucherCodeToApply = typeof code === 'string' ? code : inputVoucher;
+    if (!voucherCodeToApply || !voucherCodeToApply.trim()) {
       toast.error('Vui lòng nhập mã giảm giá!');
       return;
     }
     setIsApplyingVoucher(true);
     try {
-      await applyVoucher(inputVoucher.trim());
+      await applyVoucher(voucherCodeToApply.trim());
       toast.success('Áp dụng mã giảm giá thành công!');
       setInputVoucher('');
     } catch (error) {
@@ -491,12 +502,7 @@ const CartPage = () => {
       isOpen={isVoucherModalOpen}
       onClose={() => setIsVoucherModalOpen(false)}
       onSelectVoucher={(code) => {
-        setInputVoucher(code);
-        // Gọi applyVoucher ngay lập tức
-        setTimeout(() => {
-          const btn = document.getElementById('btn-apply-voucher');
-          if (btn) btn.click();
-        }, 100);
+        handleApplyVoucher(code);
       }}
       cartTotal={getTotalAmount()}
     />
```

---

#### 2. Test Execution Output Logs

##### A. Integration Tests (`node src/tests/voucher.test.js`)
```
CONNECTED TO DATABASE FOR TESTING
--- 1. Testing validateVoucher ---
Valid percentage check: PASS
Valid fixed check: PASS
Non-existent code: PASS
Expired: PASS
Unavailable: PASS
Max uses: PASS
Min order amount check: PASS
--- 2. Testing Order Service Integration ---
Order creation with voucher finalAmount check: PASS
Add items to order voucher recalculation check: PASS
Cancel item check: totalAmount = 50000
Cancel item check: finalAmount = 50000
Cancel item check: voucherCode = null
Cancel item check (voucher removed since subtotal < 100k): PASS
--- 3. Testing Payment Service Integration ---
Database Table Status after reset: trong
Voucher usedCount before order creation: 0
Voucher usedCount after order creation: 1
Voucher usedCount incremented during order creation check: PASS
Payment amount check (should be finalAmount): PASS
Voucher usedCount after payment confirmation: 1
No double increment check: PASS

ALL TESTS COMPLETED!
```

##### B. Edge Cases Tests (`node src/tests/voucher_edge_cases.test.js`)
```
CONNECTED TO DATABASE FOR EDGE CASE TESTING

--- 1. Testing voucher with order amount EXACTLY equal to minOrderAmount ---
validateVoucher result (discount = 10000, final = 90000): PASS
Order creation with exact minOrderAmount: PASS

--- 2. Testing voucher with order amount LESS than minOrderAmount ---
validateVoucher less than minOrderAmount: PASS (Đơn hàng tối thiểu phải từ 100.000đ để sử dụng mã này)
Order creation with less than minOrderAmount: PASS (Đơn hàng tối thiểu phải từ 100.000đ để sử dụng mã này)

--- 3. Testing Voucher expiration date logic ---
validateVoucher after expiryDate: PASS (Mã giảm giá đã hết hạn sử dụng)
validateVoucher before/on expiryDate (valid): PASS

--- 4. Testing voucher deleted vs isAvailable = false ---
validateVoucher for non-existent/deleted code: PASS (Mã giảm giá không tồn tại)
validateVoucher when isAvailable is false: PASS (Mã giảm giá hiện không khả dụng)

--- 5. Testing database nulls or missing fields ---

- Test 5a: expiryDate is null
Result: PASS (Successfully threw error on null expiry: Mã giảm giá đã hết hạn sử dụng )

- Test 5b: discountValue is null (discountType = "fixed")
Result of validateVoucher: { voucherCode: 'NULL_VAL', discountAmount: 0, finalAmount: 50000 }
Result: PASS (Coerced null value safely to 0 discount or similar without crashing)

- Test 5c: discountValue is missing/undefined
Result of validateVoucher: { voucherCode: 'MISSING_VAL', discountAmount: 0, finalAmount: 50000 }
Result: PASS (Safe)

- Test 5d: discountType is null/undefined
Result of validateVoucher: { voucherCode: 'NULL_TYPE', discountAmount: 10000, finalAmount: 40000 }
Result: PASS (Treated missing discountType as 0 discount safely)

--- Test suite summary ---
Status: SUCCESS (All edge cases behaved as expected)
```

##### C. Patterns Tests (`node src/tests/voucher_patterns.test.js`)
```
CONNECTED TO DATABASE FOR PATTERNS TESTING

--- 1. Testing Atomic Reservation & Limit Enforcement ---
First order created successfully: PASS
usedCount after first order (should be 1): PASS
Second order creation failed as expected: PASS (Mã giảm giá đã hết lượt sử dụng)

--- 2. Testing Rollback on Save Failure ---
Order creation failed as expected during save: PASS (Order validation failed: orderType: `invalid_type_to_fail_save` is not a valid enum value for path `orderType`.)
Voucher usedCount after failed creation rollback (should be 0): PASS

--- 3. Testing Rollback on Cancel ---
Voucher usedCount before cancel (should be 1): PASS
Voucher usedCount after order cancelled (should be 0): PASS

--- 4. Testing Prevent Locked/Abandoned Voucher Holds ---
Voucher usedCount with unpaid order (should be 1): PASS
New order created successfully: PASS
Prior unpaid order status (should be da_huy): PASS
Voucher usedCount after new order and prior order cancellation (should be 1): PASS

--- Patterns Test suite summary ---
Status: SUCCESS
```

##### D. Stress Tests (`node src/tests/voucher.stress.js`)
```
CONNECTED TO DATABASE FOR STRESS TESTING
--- 1. Testing fixed discount larger than subtotal ---
Validate result (discountAmount = 20000, finalAmount = 0): PASS
Order created: totalAmount = 20000 , discountAmount = 20000 , finalAmount = 0
Order with discount larger than subtotal check: PASS
--- 2. Testing voucher validation on 0 subtotal order ---
Validate 0 subtotal: PASS
--- 3. Testing percentage discount greater than 100% (capping) ---
Validate result (discountAmount = 50000, finalAmount = 0): PASS
Order created with 120% voucher: totalAmount = 40000 , discountAmount = 40000 , finalAmount = 0
Order 120% discount check: PASS

STRESS TESTS COMPLETED!
```

##### E. Frontend Build (`npm run build`)
```
vite v5.4.21 building for production...
transforming...
✓ 2734 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.14 kB │ gzip:   0.61 kB
dist/assets/index-BH5HfkQD.css     87.71 kB │ gzip:  13.59 kB
dist/assets/index-BxMys2eh.js   1,359.72 kB │ gzip: 396.04 kB
✓ built in 7.45s
```
