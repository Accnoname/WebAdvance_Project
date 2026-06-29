const crypto = require('crypto');
const querystring = require('qs');

// Sắp xếp params và tạo chữ ký HMAC-SHA512 cho VNPay
const createVNPayUrl = (orderInfo) => {
  const date = new Date();
  const createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Amount: orderInfo.amount * 100,
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: orderInfo.ipAddr || '127.0.0.1',
    vnp_Locale: 'vn',
    vnp_OrderInfo: orderInfo.description,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_TxnRef: orderInfo.orderId,
  };

  const sortedParams = sortObject(vnpParams);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  sortedParams.vnp_SecureHash = signed;
  return `${process.env.VNPAY_URL}?${querystring.stringify(sortedParams, { encode: false })}`;
};

const verifyVNPaySignature = (vnpayData) => {
  const secureHash = vnpayData.vnp_SecureHash;
  const params = { ...vnpayData };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return secureHash === signed;
};

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => { sorted[key] = obj[key]; });
  return sorted;
};

module.exports = { createVNPayUrl, verifyVNPaySignature };
