# 📅 TUẦN 4 — Payment (VNPay + Offline)

> **Thời gian**: Tuần 4  
> **Mục tiêu**: Hệ thống thanh toán VNPay + tiền mặt/chuyển khoản

---

## 🎯 Mục Tiêu Cuối Tuần

- [ ] Thanh toán tiền mặt / chuyển khoản hoạt động
- [ ] Thanh toán VNPay redirect + nhận callback thành công
- [ ] Trạng thái đơn cập nhật sau khi thanh toán xong
- [ ] Khách thấy kết quả thanh toán qua Socket.IO
- [ ] Nhân viên có thể xác nhận thanh toán offline

---

## 👨‍💻 Dev A — Backend

### Ngày 1: Cấu hình VNPay Sandbox
- [ ] Đăng ký tài khoản VNPay Sandbox tại: https://sandbox.vnpayment.vn/devsupport/
- [ ] Lấy `TmnCode` + `HashSecret` → điền vào `.env`
- [ ] Kiểm tra `vnpay.util.js` (`createVNPayUrl`, `verifyVNPaySignature`)
- [ ] Test tạo URL VNPay bằng Postman — redirect thành công vào trang giả lập

### Ngày 2-3: Payment Service

- [ ] Implement `payment.service.js`:

```js
// Thanh toán offline (tiền mặt / chuyển khoản)
const createOfflinePayment = async ({ orderId, method, processedBy }) => {
  // 1. Tìm order, check status = 'hoan_thanh'
  // 2. Tạo Payment với status = 'da_thanh_toan'
  // 3. Cập nhật table.status → 'trong'
  // 4. Emit socket 'payment:success'
  // 5. Return payment
};

// Tạo URL redirect VNPay
const createVNPayPayment = async (orderId, ipAddr) => {
  // 1. Tìm order, lấy totalAmount
  // 2. Tạo Payment pending trong DB
  // 3. Gọi createVNPayUrl() → trả về URL redirect
};

// Xử lý VNPay callback (GET request)
const handleVNPayCallback = async (vnpayData) => {
  // 1. Verify chữ ký HMAC-SHA512
  // 2. Nếu hợp lệ + vnp_ResponseCode = '00' → thanh toán thành công
  // 3. Cập nhật Payment: status, transactionId, paidAt
  // 4. Cập nhật Order status → 'hoan_thanh' nếu cần
  // 5. Cập nhật Table → 'trong'
  // 6. Emit socket 'payment:success'
};
```

### Ngày 3-4: Payment Controller + Routes
- [ ] Hoàn thiện `payment.controller.js`
- [ ] Route `GET /api/v1/payments/vnpay/callback` — xử lý IPN từ VNPay
  - Sau xử lý → redirect frontend: `${CLIENT_URL}/payment/result?status=success`
- [ ] Route `POST /api/v1/payments` — offline payment
- [ ] Route `POST /api/v1/payments/vnpay/create` — tạo VNPay URL
- [ ] Thêm route `POST /api/v1/payments/:id/refund` (Quản lý)

### Ngày 4-5: Test VNPay End-to-End
- [ ] Test flow đầy đủ:
  1. Tạo order → order `hoan_thanh`
  2. POST `/payments/vnpay/create` → nhận URL
  3. Mở URL → dùng thẻ sandbox VNPay giả lập
  4. VNPay redirect về callback URL
  5. Payment status → `da_thanh_toan`
  6. Socket emit `payment:success`
- [ ] Thẻ test VNPay sandbox: `9704198526191432198` (NCB)

---

## 👩‍💻 Dev B — Frontend

### Ngày 1-2: PaymentPage (Khách)
- [ ] Implement `PaymentPage.jsx`:
  - Hiển thị tóm tắt đơn hàng (danh sách món, tổng tiền)
  - Chọn phương thức:
    - 💵 Tiền mặt → gọi nhân viên đến thu
    - 🏦 Chuyển khoản → hiển thị QR ngân hàng
    - 💳 VNPay → nút "Thanh toán ngay" → redirect
  - Sau chọn VNPay: gọi `paymentService.createVNPay(orderId)` → redirect tới URL

### Ngày 2-3: Trang kết quả thanh toán
- [ ] Tạo `pages/customer/PaymentResultPage.jsx`:
  - Đọc query param: `?status=success` hoặc `?status=failed`
  - Nếu `success`: hiển thị icon ✅, tóm tắt + nút về trang chủ
  - Nếu `failed`: icon ❌, thông báo + nút thử lại

- [ ] Thêm route vào router:
  ```jsx
  { path: '/payment/result', element: <PaymentResultPage /> }
  ```

### Ngày 3-4: PaymentProcessPage (Nhân viên)
- [ ] Implement `PaymentProcessPage.jsx`:
  - Danh sách các đơn cần thanh toán (status = `hoan_thanh`, chưa có payment)
  - Chọn đơn → hiển thị chi tiết + tổng tiền
  - Chọn phương thức thanh toán: tiền mặt / chuyển khoản
  - Nút "Xác nhận đã thu tiền" → `POST /api/v1/payments`
  - Sau xác nhận: bàn chuyển sang `trong`

### Ngày 4-5: Socket Payment + UX
- [ ] Lắng nghe socket `payment:success` → hiển thị toast "Thanh toán thành công"
- [ ] Cập nhật `TablesPage`: khi nhận `table:status-changed` → bàn trở về màu xanh (trống)
- [ ] Animation loading khi đang redirect VNPay

---

## 🔌 API Contract — Tuần 4

### POST `/api/v1/payments/vnpay/create`
```json
// Request (Auth: Bearer)
{ "orderId": "64abc..." }

// Response 200
{
  "success": true,
  "message": "Tạo URL VNPay thành công",
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
  }
}
```

### GET `/api/v1/payments/vnpay/callback` (VNPay gọi)
```
Query params từ VNPay:
  vnp_Amount, vnp_BankCode, vnp_OrderInfo,
  vnp_ResponseCode, vnp_TxnRef, vnp_SecureHash, ...

vnp_ResponseCode:
  "00" → Thành công
  "24" → Khách hủy giao dịch
  other → Thất bại

→ Redirect đến: http://localhost:5173/payment/result?status=success|failed
```

### POST `/api/v1/payments` (Offline)
```json
// Request
{
  "orderId": "64abc...",
  "method": "tien_mat"   // hoặc "chuyen_khoan"
}

// Response 201
{
  "success": true,
  "data": {
    "_id": "...",
    "order": "64abc...",
    "amount": 195000,
    "method": "tien_mat",
    "status": "da_thanh_toan",
    "paidAt": "2026-06-29T..."
  }
}

// Socket emit:
// Event: "payment:success"
// Payload: { payment, tableId }
```

---

## 🏦 Thẻ Test VNPay Sandbox

```
Ngân hàng: NCB
Số thẻ:    9704198526191432198
Tên chủ:   NGUYEN VAN A
Ngày HH:   07/15
Mật khẩu:  123456
OTP:       123456
```

---

## ✅ Definition of Done

- [ ] VNPay flow end-to-end: đặt món → thanh toán → thành công
- [ ] Offline payment hoạt động qua nhân viên
- [ ] Bàn tự động về `trong` sau khi thanh toán
- [ ] Trang `/payment/result` hiển thị đúng kết quả

---

## 🚨 Điểm Cần Lưu Ý

> **Dev A**: `VNPAY_RETURN_URL` phải là URL public nếu test thật. Khi dev local dùng `ngrok` để expose port 3000

> **Dev A**: Verify HMAC-SHA512 bắt buộc — không skip bước này

> **Dev B**: Sau khi redirect VNPay xong, đọc query params `status` từ URL để hiển thị kết quả

> **Dev B**: Không hardcode tiền trong frontend — luôn lấy `totalAmount` từ API

---

## 📌 Branch & PR

```
Dev A: git checkout -b backend/week4-payment-vnpay
Dev B: git checkout -b frontend/week4-payment-ui

# PR Title:
# [Week4] Backend - VNPay integration + offline payment
# [Week4] Frontend - PaymentPage, PaymentResultPage, PaymentProcessPage
```
