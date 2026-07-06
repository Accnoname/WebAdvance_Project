const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// [M1] Chỉ nhan_vien và quan_ly mới được xác nhận thanh toán offline
router.post('/',              authenticate, authorizeRole('nhan_vien', 'quan_ly'), PaymentController.createPayment);
router.post('/vnpay/create',  authenticate, PaymentController.createVNPayPayment);
router.get('/vnpay/callback', PaymentController.vnpayCallback);

module.exports = router;
