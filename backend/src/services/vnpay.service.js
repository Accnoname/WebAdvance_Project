// VNPay Service — wrapper cho util
const { createVNPayUrl, verifyVNPaySignature } = require('../utils/vnpay.util');

const generatePaymentUrl = (orderInfo) => createVNPayUrl(orderInfo);

const verifyCallback = (data) => verifyVNPaySignature(data);

module.exports = { generatePaymentUrl, verifyCallback };
