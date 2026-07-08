const PaymentService = require('../services/payment.service');
const { sendSuccess } = require('../utils/response.util');

// ─── 1. Tạo thanh toán offline (tiền mặt / chuyển khoản) ───────────────────
const createPayment = async (req, res, next) => {
  try {
    const data = await PaymentService.createOfflinePayment(req.body);
    res.status(201).json(sendSuccess('Tạo thanh toán thành công', data, 201));
  } catch (error) { next(error); }
};

// ─── 2. Tạo URL thanh toán VNPay ────────────────────────────────────────────
const createVNPayPayment = async (req, res, next) => {
  try {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = await PaymentService.createVNPayPayment(req.body.orderId, ipAddr);
    res.status(200).json(sendSuccess('Tạo URL VNPay thành công', { paymentUrl: result.vnpayUrl }));
  } catch (error) { next(error); }
};

// ─── 3. Return URL — VNPay redirect user về đây sau khi thanh toán ──────────
//    ⚠️  CHỈ redirect, KHÔNG update DB (theo đúng yêu cầu bảo mật VNPay)
const vnpayReturn = (req, res, next) => {
  try {
    const result = PaymentService.handleVNPayReturn(req.query);
    const frontendUrl = `${process.env.CLIENT_URL}/payment/result`;
    const redirectUrl = `${frontendUrl}?success=${result.isSuccess}&code=${result.responseCode}&orderId=${result.orderId}&amount=${result.amount}`;
    res.redirect(redirectUrl);
  } catch (error) { next(error); }
};

// ─── 4. IPN — VNPay gọi ngầm, đây là nơi DUY NHẤT update Database ──────────
//    ✅  Trả về JSON { RspCode, Message } HTTP 200 cho VNPay
const vnpayIPN = async (req, res, next) => {
  try {
    const result = await PaymentService.handleVNPayIPN(req.query);
    // VNPay yêu cầu response HTTP 200 với body JSON này
    res.status(200).json(result);
  } catch (error) {
    // Dù có lỗi vẫn phải trả 200 để VNPay không retry
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

module.exports = { createPayment, createVNPayPayment, vnpayReturn, vnpayIPN };
