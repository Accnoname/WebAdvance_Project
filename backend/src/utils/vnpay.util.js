const crypto = require('crypto');
const querystring = require('qs');

/**
 * Sắp xếp các key của object theo thứ tự alphabet (yêu cầu của VNPay)
 */
const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => { sorted[key] = obj[key]; });
  return sorted;
};

/**
 * Format ngày giờ theo chuẩn VNPay: YYYYMMDDHHmmss (UTC+7)
 */
const formatVNPayDate = (date) => {
  // Chuyển sang múi giờ Việt Nam (UTC+7)
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
};

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} orderInfo - Thông tin đơn hàng
 * @param {string} orderInfo.orderId      - ID đơn hàng (dùng làm vnp_TxnRef)
 * @param {number} orderInfo.amount       - Số tiền (VND, chưa nhân 100)
 * @param {string} orderInfo.description  - Mô tả đơn hàng
 * @param {string} orderInfo.ipAddr       - IP người dùng
 * @returns {string} URL đầy đủ để redirect sang VNPay
 */
const createVNPayUrl = (orderInfo) => {
  const now = new Date();

  // Thời hạn thanh toán: 15 phút kể từ lúc tạo
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);

  const vnpParams = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    process.env.VNPAY_TMN_CODE,
    vnp_Amount:     orderInfo.amount * 100, // VNPay yêu cầu đơn vị là 1/100 VND
    vnp_CreateDate: formatVNPayDate(now),
    vnp_ExpireDate: formatVNPayDate(expireDate),
    vnp_CurrCode:   'VND',
    vnp_IpAddr:     orderInfo.ipAddr || '127.0.0.1',
    vnp_Locale:     'vn',
    vnp_OrderInfo:  orderInfo.description || `Thanh toan don hang ${orderInfo.orderId}`,
    vnp_OrderType:  'other',
    vnp_ReturnUrl:  process.env.VNPAY_RETURN_URL,
    vnp_TxnRef:     String(orderInfo.orderId), // Phải là string
  };

  // Bước 1: Sắp xếp param theo alphabet (bắt buộc của VNPay)
  const sortedParams = sortObject(vnpParams);

  // Bước 2: Stringify và ký HMAC-SHA512
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  // Bước 3: Thêm chữ ký vào cuối và tạo URL hoàn chỉnh
  sortedParams.vnp_SecureHash = signed;
  return `${process.env.VNPAY_URL}?${querystring.stringify(sortedParams, { encode: false })}`;
};

/**
 * Xác minh chữ ký VNPay trả về (chống giả mạo callback)
 * @param {Object} vnpayData - Query params từ VNPay redirect về
 * @returns {boolean} true nếu chữ ký hợp lệ
 */
const verifyVNPaySignature = (vnpayData) => {
  const secureHash = vnpayData.vnp_SecureHash;

  // Loại bỏ các trường chữ ký trước khi tính lại
  const params = { ...vnpayData };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  // Tính lại chữ ký và so sánh
  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return secureHash === signed;
};

module.exports = { createVNPayUrl, verifyVNPaySignature };
