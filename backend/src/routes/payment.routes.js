const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Offline: Chỉ nhân viên & quản lý mới được xác nhận thanh toán tiền mặt
router.post('/', authenticate, authorizeRole('nhan_vien', 'quan_ly'), PaymentController.createPayment);

// VNPay: Khách hàng tạo URL thanh toán (yêu cầu đăng nhập)
router.post('/vnpay/create', authenticate, PaymentController.createVNPayPayment);

// ─── Return URL: VNPay redirect user về sau khi thanh toán ─────────────────
// Không cần auth (VNPay redirect trực tiếp, không có token)
// ⚠️ CHỈ redirect frontend — KHÔNG update DB
router.get('/vnpay/return', PaymentController.vnpayReturn);

// ─── IPN (Instant Payment Notification) ────────────────────────────────────
// VNPay gọi ngầm từ server của họ để thông báo kết quả
// ✅ ĐÂY LÀ NƠI DUY NHẤT update Database
router.get('/vnpay/ipn', PaymentController.vnpayIPN);

// Giữ lại route cũ /callback để không break link cũ trong .env (alias → return)
router.get('/vnpay/callback', PaymentController.vnpayReturn);

module.exports = router;
