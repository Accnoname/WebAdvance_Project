const PaymentService = require('../services/payment.service');
const { sendSuccess } = require('../utils/response.util');

// 1. Khách yêu cầu thanh toán tiền mặt
const createPayment = async (req, res, next) => {
  try {
    const data = await PaymentService.createOfflinePayment(req.body);
    res.status(201).json(sendSuccess('Yêu cầu thanh toán đã được gửi. Nhân viên sẽ đến bàn của bạn.', data, 201));
  } catch (error) { next(error); }
};

// 2. Staff xác nhận đã thu tiền mặt
const confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { method } = req.body;
    const data = await PaymentService.confirmOfflinePayment(orderId, req.user._id, method);
    res.status(200).json(sendSuccess('Xác nhận thanh toán thành công', data));
  } catch (error) { next(error); }
};

// 3. Tạo URL thanh toán VNPay
const createVNPayPayment = async (req, res, next) => {
  try {
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ipAddr.includes(',')) ipAddr = ipAddr.split(',')[0].trim();
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';
    
    const result = await PaymentService.createVNPayPayment(req.body.orderId, ipAddr);
    res.status(200).json(sendSuccess('Tạo URL VNPay thành công', { paymentUrl: result.vnpayUrl }));
  } catch (error) { next(error); }
};

// 4. Return URL: VNPay redirect về sau khi user thanh toán
// CHỈ redirect frontend, KHÔNG update DB
const vnpayReturn = (req, res, next) => {
  try {
    const result = PaymentService.handleVNPayReturn(req.query);
    const frontendUrl = `${process.env.CLIENT_URL}/payment/result`;
    const redirectUrl = `${frontendUrl}?success=${result.isSuccess}&code=${result.responseCode}&orderId=${result.orderId}&amount=${result.amount}`;
    res.redirect(redirectUrl);
  } catch (error) { next(error); }
};

// 5. IPN: VNPay gọi ngầm — nơi DUY NHẤT update Database
const vnpayIPN = async (req, res, next) => {
  try {
    const result = await PaymentService.handleVNPayIPN(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

module.exports = { createPayment, confirmPayment, createVNPayPayment, vnpayReturn, vnpayIPN };
