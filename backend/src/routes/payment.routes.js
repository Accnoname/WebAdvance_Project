const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

router.post('/',              authenticate, PaymentController.createPayment);
router.post('/vnpay/create',  authenticate, PaymentController.createVNPayPayment);
router.get('/vnpay/callback', PaymentController.vnpayCallback);

module.exports = router;
