# Báo cáo Đánh giá Hệ thống Mã giảm giá (Voucher System Review Report)

**Thời gian đánh giá**: 2026-07-06T13:06:00Z  
**Mục tiêu**: Đánh giá tính chính xác, convention, và bảo mật của hệ thống Voucher trong Restaurant Management System.  
**Danh sách các file được đánh giá**:
- `backend/src/models/Voucher.model.js`
- `backend/src/repositories/voucher.repository.js`
- `backend/src/services/voucher.service.js`
- `backend/src/controllers/voucher.controller.js`
- `backend/src/routes/voucher.routes.js`
- `backend/src/models/Order.model.js`
- `backend/src/services/order.service.js`
- `backend/src/services/payment.service.js`

---

## Review Summary

**Verdict**: **REQUEST_CHANGES** (Cần chỉnh sửa kiến trúc Repository và khắc phục lỗi Race Condition trong VNPay callback)

---

## Findings

### 🔴 [Major] Finding 1: Bỏ qua Repository Pattern cho Order, Table, MenuItem, Voucher
- **What**: Trong `order.service.js` và `payment.service.js`, các Mongoose model (`Order`, `Table`, `MenuItem`, `Voucher`) được import trực tiếp và thực hiện truy vấn thô thông qua các hàm của Mongoose (ví dụ: `Order.findById`, `Voucher.findOne`, `Table.findByIdAndUpdate`, `order.save()`), thay vì đi qua lớp Repository tương ứng.
- **Where**: 
  - `backend/src/services/order.service.js` (Dòng 14, 71, 79, 86, 96, 104, 122, 138, 181, 187, 191...)
  - `backend/src/services/payment.service.js` (Dòng 14, 48-49, 53, 58, 80, 164, 169, 173...)
- **Why**: Vi phạm nghiêm trọng kiến trúc dự án quy định trong `AGENTS.md` ("Pattern: MVC + Repository Pattern + Service Layer" và "Repositories use error-first callback pattern, service layer wraps in Promises"). Việc truy vấn model trực tiếp trong Service layer làm mất đi tính độc lập của lớp Repository, gây khó khăn cho việc viết test và bảo trì.
- **Suggestion**: 
  - Refactor các truy vấn liên quan tới `Order`, `Table`, `MenuItem`, và `Voucher` trong `order.service.js` và `payment.service.js` thông qua các hàm Repository của chúng.
  - Các Repository này phải trả về error-first callback, và Service layer sẽ bọc chúng trong các `Promise` như cách làm ở `voucher.service.js`.

### 🔴 [Major] Finding 2: Hàm của Repository trả về Promise trực tiếp thay vì Error-First Callback
- **What**: Hàm `findByCustomer` trong `OrderRepository` được định nghĩa là một `async` function trả về Promise, thay vì sử dụng callback.
- **Where**: `backend/src/repositories/order.repository.js` (Dòng 16-18)
- **Why**: Vi phạm convention được quy định tại `AGENTS.md` ("Repositories use error-first callback pattern").
- **Suggestion**: Refactor hàm `findByCustomer` để nhận callback làm tham số thứ hai và trả về kết quả qua callback:
  ```javascript
  findByCustomer: (customerId, callback) => {
    Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .then(docs => callback(null, docs))
      .catch(err => callback(err));
  }
  ```

### 🔴 [Major] Finding 3: Race Condition trong xử lý VNPay Callback (Double Voucher Increment)
- **What**: Trong `handleVNPayCallback`, hệ thống kiểm tra trạng thái cũ của payment trước khi tăng lượt sử dụng voucher (`isFirstTimePaid = payment.status !== 'da_thanh_toan'`). Tuy nhiên, nếu hai callback IPN từ VNPay gửi đến đồng thời (concurrent), cả hai sẽ cùng đọc trạng thái `cho_thanh_toan`, cùng xác định `isFirstTimePaid = true` và cùng gọi tăng `usedCount` của Voucher lên 1. Kết quả là voucher bị cộng dồn lượt sử dụng sai (lên 2 lần).
- **Where**: `backend/src/services/payment.service.js` (Dòng 125-195)
- **Why**: Thiếu cơ chế cập nhật trạng thái atomic và kiểm tra kết quả cập nhật thực tế từ database.
- **Suggestion**: 
  - Thực hiện cập nhật trạng thái Payment bằng `findOneAndUpdate` có kèm điều kiện trạng thái chưa thanh toán, ví dụ:
    ```javascript
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: 'da_thanh_toan' } },
      { status: 'da_thanh_toan', ... },
      { new: true }
    );
    ```
  - Chỉ khi `updatedPayment` được chỉnh sửa thành công (không null) thì mới tiến hành cập nhật trạng thái Order và tăng lượt dùng Voucher.

### 🟡 [Minor] Finding 4: Trùng khớp ngày hết hạn (Timezone / Start-of-Day Expiry)
- **What**: Việc so sánh `now > new Date(voucher.expiryDate)` có thể khiến voucher hết hạn sớm hơn dự kiến. Ví dụ, nếu lưu ngày hết hạn là `2026-07-06`, Mongoose sẽ lưu dưới dạng `2026-07-06T00:00:00.000Z`. Khi khách sử dụng vào lúc 12:00 ngày 2026-07-06, voucher sẽ bị từ chối vì đã "hết hạn".
- **Where**: 
  - `backend/src/services/voucher.service.js` (Dòng 146)
  - `backend/src/services/order.service.js` (Dòng 26)
- **Why**: So sánh timestamp chi tiết thay vì ngày kết thúc của ngày hết hạn.
- **Suggestion**: Chuyển thời gian hết hạn sang cuối ngày (ví dụ `23:59:59.999` của ngày đó) trước khi so sánh, hoặc thực hiện so sánh theo ngày chỉ lấy phần Year-Month-Day.

### 🟡 [Minor] Finding 5: Không hoàn trả lượt sử dụng Voucher khi hủy Order
- **What**: Khi một đơn hàng đã thanh toán (offline hoặc online) bị hủy, lượt sử dụng của Voucher (`usedCount`) đã được cộng dồn trước đó không được hoàn trả (giảm đi 1).
- **Where**: `backend/src/services/order.service.js` (Hàm `updateStatus` dòng 265-311)
- **Why**: Thiếu logic giảm `usedCount` của voucher khi đơn hàng chuyển sang trạng thái `da_huy`.
- **Suggestion**: Trong hàm `updateStatus`, nếu `orderStatus` mới là `da_huy` và đơn hàng có sử dụng `voucherCode` hợp lệ đồng thời trạng thái thanh toán trước đó đã thành công, thực hiện giảm `usedCount` của voucher đi 1.

---

## Verified Claims

- **Code style: arrow functions only (no `function` keyword)** → Verified via `grep_search` → **PASS** (Không phát hiện từ khóa `function` định nghĩa hàm trong các file được đánh giá).
- **Mongoose model uses timestamps: true** → Verified via code inspection → **PASS** (Cả `Voucher.model.js` và `Order.model.js` đều cấu hình `{ timestamps: true }`).
- **Repositories use error-first callback pattern, service layer wraps in Promises** → Verified via code inspection → **PARTIAL PASS** (Lớp `voucher.service.js` và `payment.repository.js` tuân thủ, nhưng `order.service.js` bỏ qua hoàn toàn Repository, và `OrderRepository.findByCustomer` trả về Promise trực tiếp).
- **Try/catch blocks in all controllers** → Verified via code inspection → **PASS** (Tất cả controller của Voucher đều bọc trong `try/catch` và gọi `next(error)`).
- **No console.log debug statements** → Verified via `grep_search` → **PASS** (Không tồn tại `console.log` trong các file đang đánh giá).
- **Integration Test Execution** → Verified via command execution → **PASS** (Chạy file `backend/src/tests/voucher.test.js` thành công và tất cả 3 phần test đều trả về kết quả `PASS`).

---

## Coverage Gaps

- **Chưa kiểm tra đồng thời (Concurrency / Load testing)** — Risk level: **Medium** — Recommendation: Cần viết test giả lập VNPay gửi trùng IPN callback để kiểm thử Race Condition ở Finding 3.
- **Quyền hạn truy cập endpoint `/code/:code`** — Risk level: **Low** — Recommendation: Chấp nhận rủi ro hoặc giới hạn chỉ cho phép khách hàng đang có giỏ hàng xem, thay vì cho phép tất cả các tài khoản đăng nhập.

---

## Unverified Items

- Không có. Tất cả các nội dung yêu cầu đều được xác minh độc lập qua việc đọc code và chạy test thành công.

---

# Adversarial Challenge Report

## Challenge Summary
**Overall risk assessment**: **MEDIUM** (Hệ thống chạy đúng nghiệp vụ cơ bản, nhưng có lỗ hổng Race Condition và lỗi logic nhỏ khi hủy đơn hàng / tính múi giờ hết hạn).

## Challenges

### 🔴 [High] Challenge 1: VNPay IPN Replays / Concurrent Callbacks
- **Assumption challenged**: Giả định rằng VNPay chỉ gửi callback thành công một lần hoặc các callback được xử lý tuần tự mà không bị Race Condition.
- **Attack scenario**: VNPay gửi 2 hoặc nhiều callback IPN đồng thời cho cùng một đơn hàng do sự cố mạng hoặc cơ chế retry. Hệ thống xử lý song song, dẫn đến `usedCount` của mã giảm giá tăng lên nhiều lần.
- **Blast radius**: Voucher bị khai thác vượt quá `maxUses` quy định, gây thiệt hại tài chính cho nhà hàng.
- **Mitigation**: Dùng atomic update hoặc transaction trong MongoDB để khóa trạng thái payment khi cập nhật lần đầu tiên.

### 🟡 [Medium] Challenge 2: Start-of-day expiry timezone mismatch
- **Assumption challenged**: Giả định rằng ngày hết hạn `expiryDate` được so sánh chuẩn theo thời gian địa phương của khách hàng và kéo dài hết ngày.
- **Attack scenario**: Voucher được tạo với ngày hết hạn là ngày hôm nay. Khách hàng sử dụng lúc 8:00 sáng, hệ thống từ chối do timestamp của ngày hết hạn mặc định là 00:00:00 UTC.
- **Blast radius**: Trải nghiệm khách hàng kém, phát sinh lỗi giao dịch không đáng có.
- **Mitigation**: Cần chuẩn hóa ngày hết hạn về `23:59:59.999` hoặc so sánh date-only không kèm giờ.

---

## Stress Test Results

- **Simultaneous VNPay Callbacks** → Giả lập 2 request gọi callback đồng thời → Dự đoán: Bị Race Condition làm voucher `usedCount` tăng lên 2 → **FAIL**
- **Applying Voucher at 12:00 PM on Expiry Day** → So sánh ngày hết hạn ở giữa ngày → Dự đoán: Báo hết hạn do so sánh timestamp thô → **FAIL**
- **Cancelling Paid Order with Voucher** → Hủy đơn hàng đã thanh toán → Dự đoán: Voucher vẫn bị tính là đã dùng, không được hoàn lượt sử dụng → **FAIL**
