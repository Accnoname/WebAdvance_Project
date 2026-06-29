const PaymentService = require('../services/payment.service');
const { sendSuccess } = require('../utils/response.util');

const createPayment = async (req, res, next) => {
  try {
    const data = await PaymentService.createOfflinePayment(req.body);
    res.status(201).json(sendSuccess('Tạo thanh toán thành công', data, 201));
  } catch (error) { next(error); }
};

const createVNPayPayment = async (req, res, next) => {
  try {
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const url = await PaymentService.createVNPayPayment(req.body.orderId, ipAddr);
    res.status(200).json(sendSuccess('Tạo URL VNPay thành công', { paymentUrl: url }));
  } catch (error) { next(error); }
};

const vnpayCallback = async (req, res, next) => {
  try {
    const payment = await PaymentService.handleVNPayCallback(req.query);
    // Redirect về frontend sau thanh toán
    res.redirect(`${process.env.CLIENT_URL}/payment/result?status=${payment.status}`);
  } catch (error) { next(error); }
};

module.exports = { createPayment, createVNPayPayment, vnpayCallback };
