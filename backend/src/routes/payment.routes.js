const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Khách hàng yêu cầu thanh toán tiền mặt
router.post('/', authenticate, PaymentController.createPayment);

// Staff xác nhận đã thu tiền mặt (sau khi đến bàn)
router.post('/:orderId/confirm', authenticate, authorizeRole('nhan_vien', 'quan_ly'), PaymentController.confirmPayment);

// VNPay: Khách tạo URL thanh toán online
router.post('/vnpay/create', authenticate, PaymentController.createVNPayPayment);

// Return URL: VNPay redirect sau khi user thanh toán xong
// CHỈ redirect frontend, KHÔNG update DB
router.get('/vnpay/return', PaymentController.vnpayReturn);

// IPN: VNPay gọi ngầm — nơi DUY NHẤT update DB
router.get('/vnpay/ipn', PaymentController.vnpayIPN);

// Alias
router.get('/vnpay/callback', PaymentController.vnpayReturn);

module.exports = router;
