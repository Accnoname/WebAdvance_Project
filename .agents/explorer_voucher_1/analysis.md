# Báo Cáo Phân Tích Hệ Thống Khuyến Mãi (Voucher), Thanh Toán (VNPay) và Giỏ Hàng

## Tóm Tắt Chính
Hệ thống khuyến mãi và thanh toán hiện tại đã triển khai được các luồng cơ bản nhưng còn tồn tại một số **lỗ hổng bảo mật nghiêm trọng (Double-Use / Race Condition)**, **trùng lặp code ở Backend**, cùng với **bug logic hiển thị và vận hành ở Frontend**. Điển hình là việc voucher có thể bị sử dụng vượt mức `maxUses` do `usedCount` chỉ được tăng sau khi thanh toán thành công mà không có kiểm tra giới hạn tại thời điểm đó, và việc thiếu hoàn trả lượt dùng voucher khi đơn hàng bị hủy.

---

## 1. Chi Tiết Model Schema của Voucher và Order

### 1.1. Model Voucher (`backend/src/models/Voucher.model.js`)
Lưu trữ thông tin cấu hình và trạng thái sử dụng của mã giảm giá:
- `code`: `String` (Unique, required, uppercase, trim) - Mã voucher (ví dụ: `TESTPERCENT`).
- `discountType`: `String` (Enum: `['percentage', 'fixed']`, required) - Loại giảm giá (theo phần trăm hoặc số tiền cố định).
- `discountValue`: `Number` (Required, min: 0) - Giá trị giảm giá.
- `minOrderAmount`: `Number` (Default: 0) - Giá trị đơn hàng tối thiểu để áp dụng mã.
- `maxUses`: `Number` (Default: null) - Số lượt sử dụng tối đa của mã này (nếu null là không giới hạn).
- `usedCount`: `Number` (Default: 0) - Số lượt thực tế mã đã được sử dụng thành công.
- `expiryDate`: `Date` (Required) - Ngày hết hạn của mã giảm giá.
- `isAvailable`: `Boolean` (Default: true) - Trạng thái khả dụng (nếu false thì không thể áp dụng).
- `description`: `String` (Default: '') - Mô tả ngắn gọn về voucher.
- `createdBy`: `ObjectId` (Ref: `User`, default: null) - Người tạo voucher.
- `timestamps`: Tự động tạo `createdAt` và `updatedAt`.

### 1.2. Model Order (`backend/src/models/Order.model.js`)
Lưu trữ thông tin đơn hàng và ghi nhận voucher đã áp dụng:
- `orderType`: `String` (Enum: `['tai_ban', 'giao_hang']`, default: `tai_ban`).
- `table`: `ObjectId` (Ref: `Table`, optional) - Bàn ăn nếu ăn tại bàn.
- `customer`: `ObjectId` (Ref: `User`, optional) - Khách hàng thành viên đặt đơn.
- `items`: Mảng chứa các món ăn đặt mua (`orderItemSchema`), mỗi món lưu:
  - `menuItem`: `ObjectId` (Ref: `MenuItem`, required).
  - `quantity`: `Number` (Min: 1).
  - `price`: `Number` (Required) - **Snapshot giá món ăn tại thời điểm đặt** (bảo vệ đơn hàng khỏi việc thay đổi giá thực đơn sau này).
  - `status`: `String` (Enum: `['cho_xac_nhan', 'dang_che_bien', 'cho_phuc_vu', 'hoan_thanh', 'huy']`).
- `orderStatus`: `String` (Enum: `['moi', 'dang_xu_ly', 'hoan_thanh', 'da_huy']`, default: `moi`).
- `paymentMethod`: `String` (Enum: `['tien_mat', 'chuyen_khoan', 'vnpay', 'khac']`, default: `tien_mat`).
- `isPaid`: `Boolean` (Default: false) - Trạng thái đã thanh toán.
- `totalAmount`: `Number` (Required) - Tổng tiền tạm tính trước giảm giá (tổng các `price * quantity`).
- `voucherCode`: `String` (Default: null) - Mã voucher áp dụng cho đơn hàng này.
- `discountAmount`: `Number` (Default: 0) - Số tiền được giảm từ voucher.
- `finalAmount`: `Number` (Required) - Số tiền cuối cùng khách phải trả (`totalAmount - discountAmount`).
- `orderedBy`: `ObjectId` (Ref: `User`) - Người thực hiện đặt đơn.

---

## 2. Cơ Chế Tính Toán Giảm Giá và Validate ở Backend

### 2.1. Trùng Lặp Code Validate (Code Duplication)
Hệ thống hiện tại có hai hàm độc lập thực hiện validate voucher:
1. `validateVoucher` trong `backend/src/services/voucher.service.js` (gọi từ endpoint validate `/vouchers/validate` của frontend).
2. `validateAndCalculateVoucher` trong `backend/src/services/order.service.js` (gọi nội bộ khi tạo đơn hàng mới hoặc khi chỉnh sửa đơn hàng).

Sự trùng lặp này vi phạm nguyên tắc DRY (Don't Repeat Yourself) và dễ dẫn đến sai lệch logic khi bảo trì hệ thống.

### 2.2. Các Ràng Buộc Được Validate (Độ Tin Cậy)
Cả hai hàm đều validate đầy đủ các điều kiện sau:
- **Tồn tại**: Kiểm tra xem code có tồn tại trong cơ sở dữ liệu không (404 Not Found).
- **Tính khả dụng**: Kiểm tra `isAvailable` có bằng `true` hay không.
- **Thời hạn sử dụng**: So sánh `new Date()` với `expiryDate`.
- **Tổng lượt sử dụng**: So sánh `usedCount` với `maxUses` (nếu `maxUses` khác null).
- **Giá trị đơn hàng tối thiểu**: Kiểm tra `orderAmount` (hoặc `subTotal`) có lớn hơn hoặc bằng `minOrderAmount` của voucher hay không.

### 2.3. Cách Tính Số Tiền Giảm Giá
Số tiền giảm giá được tính dựa trên `discountType`:
- Nếu `discountType === 'percentage'`: `discountAmount = Math.floor(orderAmount * (discountValue / 100))`.
- Nếu `discountType === 'fixed'`: `discountAmount = discountValue`.
- **Cơ chế Capping an toàn**: Số tiền giảm được giới hạn trong khoảng từ `0` đến `orderAmount` để tránh việc giảm giá âm hoặc vượt quá giá trị đơn hàng:
  `discountAmount = Math.max(0, Math.min(discountAmount, orderAmount))`.
  `finalAmount = orderAmount - discountAmount`.

### 2.4. Điểm Yếu và Gaps trong Tính Toán:
1. **Không validate đối tượng sử dụng (User Eligibility)**: Voucher không lưu lịch sử hoặc giới hạn số lần sử dụng trên mỗi User. Một user có thể dùng đi dùng lại cùng một mã giảm giá nhiều lần trên nhiều đơn hàng khác nhau.
2. **Lỗi crash logic/NaN (Vulnerability)**: Trong test case `Test 5c` ở file `voucher_edge_cases.test.js`, nếu trường `discountValue` không được định nghĩa hoặc bị bỏ trống trong DB (undefined), khi tính toán giảm giá cố định (`fixed`), `discountAmount` sẽ nhận giá trị `undefined`. Kết quả là các phép toán so sánh `Math.min(undefined, orderAmount)` trả về `NaN`, khiến cả `discountAmount` và `finalAmount` của đơn hàng đều trở thành `NaN`.

---

## 3. Lỗ Hổng Race Condition và Lạm Dụng Voucher (Double-Use)

### 3.1. Phân Tích Lỗ Hổng Hiện Tại
Hệ thống **hoàn toàn không ngăn chặn** được việc một voucher đơn dụng (single-use, `maxUses = 1`) bị sử dụng nhiều lần. 

**Nguyên nhân:**
- Khi khách hàng tiến hành Checkout tạo đơn hàng (`OrderService.create`), hệ thống gọi hàm `validateAndCalculateVoucher` để kiểm tra voucher. Hàm này chỉ đọc dữ liệu `Voucher.findOne(...)` để xem `usedCount < maxUses` hay chưa.
- Lúc này, đơn hàng được lưu thành công với giá giảm, nhưng **`usedCount` của voucher chưa hề được tăng lên**.
- `usedCount` chỉ được tăng lên khi đơn hàng được **thanh toán thành công** (offline được nhân viên confirm hoặc online nhận IPN VNPay thành công).

**Kịch bản Khai Thác (Double-Use):**
1. Voucher `MAMGIA50K` có `maxUses = 1` và `usedCount = 0`.
2. Khách hàng A tạo Order 1 với mã `MAMGIA50K`. Do `usedCount = 0 < 1`, Order 1 được tạo thành công với giá giảm. Trạng thái Order 1 là `moi` (chưa thanh toán), `usedCount` của voucher vẫn là `0`.
3. Ngay lập tức (hoặc đồng thời), Khách hàng B (hoặc chính Khách hàng A ở tab khác) tạo Order 2 với mã `MAMGIA50K`. Do `usedCount` vẫn bằng `0`, Order 2 tiếp tục được tạo thành công với giá giảm.
4. Cả hai đơn hàng đều được chuyển tới trang thanh toán.
5. Khi Order 1 thanh toán xong, `usedCount` tăng từ `0` lên `1`.
6. Khi Order 2 thanh toán xong, hệ thống chạy lệnh cập nhật:
   ```javascript
   await Voucher.updateOne({ code: 'MAMGIA50K' }, { $inc: { usedCount: 1 } });
   ```
   Lệnh này thực hiện tăng vô điều kiện. `usedCount` tăng từ `1` lên `2` thành công.
   **Kết quả:** Một voucher chỉ cho phép sử dụng 1 lần đã được áp dụng thành công cho 2 đơn hàng khác nhau.

### 3.2. Giải Pháp Khắc Phục Triệt Để

Có hai phương án giải quyết tùy theo yêu cầu trải nghiệm người dùng:

#### Phương án A: Giữ chỗ Voucher lúc đặt đơn (Reservation Pattern) - Khuyên Dùng
Khi khách đặt đơn hàng, ta sẽ "giữ chỗ" (reserve) lượt dùng của voucher ngay lập tức.
1. Sử dụng **Atomic Update với điều kiện** trong MongoDB tại thời điểm tạo đơn hàng:
   ```javascript
   const updatedVoucher = await Voucher.findOneAndUpdate(
     {
       code: uppercaseCode,
       isAvailable: true,
       $or: [
         { maxUses: null },
         { $expr: { $lt: ["$usedCount", "$maxUses"] } }
       ]
     },
     { $inc: { usedCount: 1 } },
     { new: true }
   );
   if (!updatedVoucher) {
     throw new AppError('Mã giảm giá đã hết lượt sử dụng hoặc không khả dụng', 400);
   }
   ```
2. Nếu quá trình tạo đơn hàng sau đó bị lỗi (ví dụ lỗi DB lưu Order), ta phải rollback giảm `usedCount` đi 1:
   ```javascript
   await Voucher.updateOne({ code: uppercaseCode }, { $inc: { usedCount: -1 } });
   ```
3. Đặt thời gian hết hạn thanh toán đơn hàng (ví dụ: Đơn VNPay phải thanh toán trong vòng 15 phút). Nếu quá 15 phút đơn hàng chưa được thanh toán, hệ thống (chạy qua Cron Job hoặc Mongoose TTL index trên một collection OrderPending) sẽ tự động hủy đơn hàng và hoàn trả lượt dùng cho voucher (`$inc: { usedCount: -1 }`).

#### Phương án B: Kiểm tra và tăng Atomic lúc xác nhận thanh toán (Payment Confirmation Guard)
Nếu chỉ muốn ghi nhận voucher đã dùng khi khách thực tế trả tiền:
1. Lúc tạo đơn hàng không tăng `usedCount`.
2. Khi xác nhận thanh toán (trong `confirmOfflinePayment` và `handleVNPayIPN`), thay vì dùng `updateOne` tăng mù quáng, ta phải dùng `findOneAndUpdate` có điều kiện ràng buộc số lượt dùng:
   ```javascript
   const result = await Voucher.findOneAndUpdate(
     {
       code: order.voucherCode.toUpperCase(),
       isAvailable: true,
       $or: [
         { maxUses: null },
         { $expr: { $lt: ["$usedCount", "$maxUses"] } }
       ]
     },
     { $inc: { usedCount: 1 } },
     { new: true }
   );
   if (!result) {
     // Lượt dùng voucher đã hết kể từ khi đặt đơn hàng!
     // Cần xử lý: Từ chối thanh toán số tiền giảm, bắt khách thanh toán đủ totalAmount
     // Hoặc đánh dấu thanh toán thất bại.
   }
   ```
   *Lưu ý*: Phương án này có nhược điểm lớn với thanh toán online (VNPay), vì khách đã chuyển khoản số tiền giảm trên ứng dụng ngân hàng. Nếu khi IPN trả về mà ta từ chối giao dịch thì sẽ gây tranh chấp tài chính. Vì vậy, **Phương án A (Reservation với TTL)** là tối ưu và chuyên nghiệp nhất.

---

## 4. Luồng Thanh Toán VNPay và Logic Hoàn Trả Voucher

### 4.1. Chi Tiết Luồng Thanh Toán VNPay
1. **Khởi tạo thanh toán (`createVNPayPayment` trong `payment.service.js`)**:
   - Nhận `orderId` từ client.
   - Tìm kiếm bản ghi Payment hiện tại của đơn hàng. Nếu trạng thái đã là `da_thanh_toan`, báo lỗi 409 (Conflict).
   - Nếu chưa có bản ghi, tạo mới một bản ghi Payment với `status: 'cho_thanh_toan'`, `method: 'vnpay'`, `amount` lấy từ `order.finalAmount` (số tiền sau khi đã chiết khấu voucher).
   - Gọi `createVNPayUrl` để tạo đường link chuyển hướng người dùng đến cổng thanh toán VNPay.
2. **Khách hàng thanh toán**: Người dùng thực hiện quét mã hoặc nhập thông tin thẻ trên giao diện VNPay.
3. **Phản hồi tức thời (`handleVNPayReturn`)**:
   - VNPay chuyển hướng trình duyệt của khách hàng về `router.get('/vnpay/return')` trên server API.
   - Server kiểm tra chữ ký HMAC và trạng thái thanh toán từ query params.
   - Chuyển hướng người dùng về trang giao diện kết quả của frontend: `/payment/result?success=...&code=...`.
   - **Hoàn toàn không có thao tác cập nhật cơ sở dữ liệu ở bước này** để tránh việc người dùng thao túng dữ liệu client gửi về.
4. **Webhook gọi ngầm IPN (`handleVNPayIPN`)**:
   - VNPay gửi request ngầm (server-to-server) đến endpoint `/vnpay/ipn`. Đây là **nơi duy nhất cập nhật trạng thái thanh toán và voucher**.
   - Kiểm tra tính toàn vẹn của chữ ký HMAC-SHA512.
   - Tìm đơn hàng, xác minh số tiền chuyển khoản khớp với số tiền cần thanh toán trong DB.
   - Nếu payment record đã ở trạng thái `da_thanh_toan`, trả về `RspCode: '02'` (Order already confirmed) để tránh xử lý trùng lặp (Idempotency).
   - Cập nhật trạng thái Payment sang `da_thanh_toan` (hoặc `that_bai` nếu giao dịch lỗi) và lưu các mã giao dịch VNPay.
   - Nếu thanh toán thành công (`responseCode === '00'`):
     - Cập nhật `order.isPaid = true`.
     - Nếu đơn hàng có áp dụng voucher, thực hiện tăng lượt dùng voucher:
       ```javascript
       await Voucher.updateOne(
         { code: order.voucherCode.toUpperCase() },
         { $inc: { usedCount: 1 } }
       );
       ```

### 4.2. Xử Lý Khi Giao Dịch Thất Bại hoặc Bị Hủy
- **Khi thanh toán VNPay thất bại hoặc khách hàng chủ động hủy trên cổng thanh toán**:
  - VNPay IPN gọi về trả kết quả mã lỗi (ví dụ: `24` - Khách hàng hủy giao dịch).
  - Trạng thái Payment được cập nhật thành `that_bai`. Trạng thái đơn hàng vẫn là `moi`, `isPaid` vẫn là `false`.
  - Lúc này, voucher's `usedCount` **chưa từng được tăng lên** nên hệ thống không cần thực hiện rollback/hoàn trả lượt sử dụng. Khách hàng vẫn có thể nhấn nút "Thử thanh toán lại" trên UI để thực hiện lại giao dịch bằng chính voucher đó.
- **Lỗ hổng logic khi hủy đơn hàng đã thanh toán (Vulnerability)**:
  - Khi một đơn hàng đã được thanh toán thành công (ở trạng thái `isPaid = true`, và voucher `usedCount` đã được cộng 1), nếu sau đó người quản lý hoặc nhân viên cập nhật trạng thái đơn hàng thành `da_huy` (trong hàm `updateStatus` của `order.service.js`):
  - Hệ thống thực hiện giải phóng bàn ăn về trạng thái trống, lưu đơn hàng là `da_huy` nhưng **hoàn toàn không hoàn trả lượt sử dụng cho voucher**. Mã giảm giá áp dụng cho đơn hàng bị hủy đó bị mất đi một lượt dùng vô ích.
  - **Cách khắc phục**: Trong `updateStatus` của `order.service.js`, nếu trạng thái mới là `da_huy` và đơn hàng trước đó đã được thanh toán (`isPaid === true`) đồng thời có sử dụng voucher (`voucherCode` khác null), hãy thực hiện giảm `usedCount` của voucher đi 1:
    ```javascript
    if (orderStatus === 'da_huy' && order.isPaid && order.voucherCode) {
      await Voucher.updateOne(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: -1 } }
      );
    }
    ```

---

## 5. Quy Trình UI Giỏ Hàng và Checkout Ở Frontend

### 5.1. Quy Trình Nhập và Validate Voucher
- Tại trang Giỏ hàng (`CartPage.jsx`), người dùng có thể áp dụng mã bằng cách nhập mã thủ công vào ô input hoặc mở modal danh sách voucher khả dụng (`VoucherSelectorModal.jsx`) và chọn mã.
- Khi người dùng nhấn nút "Áp dụng", sự kiện `handleApplyVoucher` gọi hàm `applyVoucher(code)` từ Zustand store `cartStore.js`.
- Zustand store thực hiện gửi request POST tới backend thông qua `VoucherService.validate(code, subTotal)`.
- **Nếu validate thành công**: API trả về `{ voucherCode, discountAmount, finalAmount }`. Zustand store lưu `voucherCode` và `discountAmount` vào global state. Giao diện giỏ hàng cập nhật ngay lập tức số tiền giảm giá và tổng tiền cuối cùng.
- **Nếu validate thất bại**: Catch block của Zustand store reset `voucherCode` về `null` và `discountAmount` về `0`. Ngoại lệ được ném lại cho component UI, và hiển thị thông báo lỗi bằng thông báo toast (`toast.error(error.response?.data?.message || ...)`).
- **Hành vi reset tự động**: Để tránh sai lệch dữ liệu, nếu người dùng thêm món, xóa món hoặc thay đổi số lượng món ăn trong giỏ hàng, Zustand store sẽ tự động gọi `removeVoucher()` và hiển thị cảnh báo yêu cầu người dùng áp dụng lại mã giảm giá.

### 5.2. Hiển Thị Giá Trị Giảm Giá Trong Giỏ Hàng
Tổng tiền giỏ hàng hiển thị ở 2 phần:
- Tạm tính: `getTotalAmount()` (Tổng tiền các món ăn).
- Giảm giá: Hiển thị `- {discountAmount}đ` đi kèm với nhãn mã giảm giá (ví dụ: `(TESTPERCENT)`).
- Tổng thanh toán: Được tính toán thông qua `getFinalAmount()`: `Math.max(0, subTotal - discountAmount)`.

### 5.3. Các Lỗi Logic và Bug Thiết Kế ở Frontend
Trong quá trình kiểm tra mã nguồn frontend, phát hiện 2 điểm cần cải tiến:

#### Lỗi 1: Sai lệch tên Type trong hiển thị `VoucherSelectorModal.jsx` (Bug hiển thị)
Trong file `frontend/src/components/VoucherSelectorModal.jsx` tại dòng 87 và 104:
```javascript
// Dòng 87
{voucher.discountType === 'percent' ? '%' : '₫'}

// Dòng 104
Giảm {voucher.discountType === 'percent' 
  ? `${voucher.discountValue}%` 
  : formatCurrency(voucher.discountValue)}
```
- **Vấn đề**: Thành phần này đang kiểm tra trường `discountType === 'percent'`.
- **Thực tế**: Schema của Backend chỉ định nghĩa loại giảm giá là `'percentage'` hoặc `'fixed'`.
- **Hậu quả**: Phép kiểm tra `voucher.discountType === 'percent'` luôn trả về `false`. Do đó, đối với tất cả voucher giảm giá theo phần trăm (ví dụ: giảm 10%), giao diện sẽ hiển thị sai ký hiệu là **Giảm 10₫** (hoặc 10 VND) thay vì **Giảm 10%**.

#### Lỗi 2: Cơ chế click DOM mong manh khi áp dụng voucher từ modal (Code smell/Fragility)
Trong file `frontend/src/pages/customer/CartPage.jsx` tại dòng 503-510:
```javascript
onSelectVoucher={(code) => {
  setInputVoucher(code);
  // Gọi applyVoucher ngay lập tức
  setTimeout(() => {
    const btn = document.getElementById('btn-apply-voucher');
    if (btn) btn.click();
  }, 100);
}}
```
- **Vấn đề**: Khi người dùng chọn voucher từ modal, thay vì gọi trực tiếp hàm xử lý `applyVoucher(code)`, code lại cập nhật state `inputVoucher` rồi dùng `setTimeout` chờ 100ms để kích hoạt sự kiện click mô phỏng của nút áp dụng bằng Javascript DOM (`btn.click()`).
- **Hậu quả**: Cách viết này phụ thuộc nhiều vào cấu trúc DOM của HTML, dễ bị lỗi nếu nút bị ẩn, đổi ID hoặc nếu React chưa kịp render lại input. Nó tạo ra "code smell" khó bảo trì.
- **Khuyến nghị sửa đổi**: Nên viết một hàm handler áp dụng trực tiếp nhận mã code làm tham số và gọi thẳng trong sự kiện `onSelectVoucher`.
