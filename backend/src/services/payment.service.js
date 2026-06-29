const PaymentRepository = require('../repositories/payment.repository');
const { createVNPayUrl, verifyVNPaySignature } = require('../utils/vnpay.util');

// TODO: Implement
const createOfflinePayment = async (data) => { throw new Error('TODO'); };
const createVNPayPayment = async (orderId, ipAddr) => { throw new Error('TODO'); };
const handleVNPayCallback = async (vnpayData) => { throw new Error('TODO'); };

module.exports = { createOfflinePayment, createVNPayPayment, handleVNPayCallback };
