const PaymentRepository = require('../repositories/payment.repository');
const { createVNPayUrl, verifyVNPaySignature } = require('../utils/vnpay.util');
const { AppError } = require('../middlewares/error.middleware');
const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const Voucher = require('../models/Voucher.model');
const { getIO } = require('../config/socket');

// ─── 1. Tạo thanh toán offline (tiền mặt / chuyển khoản) ───────────────────
const createOfflinePayment = async (data) => {
  const { orderId, method, processedBy } = data;

  // Kiểm tra đơn hàng tồn tại
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  // [C2] Chặn double payment — reject nếu đã có BẤT KỲ record nào
  const existingPayment = await new Promise((resolve, reject) => {
    PaymentRepository.findByOrder(orderId, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (existingPayment) {
    if (existingPayment.status === 'da_thanh_toan') {
      throw new AppError('Đơn hàng này đã được thanh toán', 409);
    }
    throw new AppError('Đơn hàng này đã có bản ghi thanh toán đang xử lý', 409);
  }

  // Tạo record thanh toán mới
  const payment = await new Promise((resolve, reject) => {
    PaymentRepository.create({
      order:       orderId,
      amount:      order.finalAmount !== undefined && order.finalAmount !== null ? order.finalAmount : order.totalAmount,
      method,                        // 'tien_mat' hoặc 'chuyen_khoan'
      status:      'da_thanh_toan',  // Offline thì xác nhận luôn
      paidAt:      new Date(),
      processedBy: processedBy || null,
    }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  // Cập nhật trạng thái đơn hàng → hoàn thành
  order.orderStatus = 'hoan_thanh';
  await order.save();

  // Tăng lượt sử dụng của voucher
  if (order.voucherCode) {
    await Voucher.updateOne({ code: order.voucherCode.toUpperCase() }, { $inc: { usedCount: 1 } });
  }

  // [C3] Giải phóng bàn sau khi thanh toán offline
  if (order.table) {
    await Table.findByIdAndUpdate(order.table, {
      status: 'trong',
      currentOrder: null,
    });
  }

  // Emit socket thông báo thanh toán thành công
  const io = getIO();
  if (io) {
    io.to('staff').emit('payment:success', { payment, orderId, method });
    if (order.table) {
      io.to(`table:${order.table}`).emit('payment:success', { payment, orderId });
      io.to('staff').emit('table:status-changed', { tableId: order.table, status: 'trong' });
    }
  }

  return payment;
};

// ─── 2. Tạo URL thanh toán VNPay ────────────────────────────────────────────
const createVNPayPayment = async (orderId, ipAddr) => {
  // Lấy đơn hàng để biết số tiền
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  // Chỉ tạo payment record nếu chưa có (idempotent)
  const existingPayment = await new Promise((resolve, reject) => {
    PaymentRepository.findByOrder(orderId, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (existingPayment && existingPayment.status === 'da_thanh_toan') {
    throw new AppError('Đơn hàng này đã được thanh toán', 409);
  }

  // Tạo hoặc tái sử dụng record payment đang chờ
  let payment;
  if (!existingPayment) {
    payment = await new Promise((resolve, reject) => {
      PaymentRepository.create({
        order:  orderId,
        amount: order.finalAmount !== undefined && order.finalAmount !== null ? order.finalAmount : order.totalAmount,
        method: 'vnpay',
        status: 'cho_thanh_toan',
      }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  } else {
    payment = existingPayment;
  }

  // Tạo URL redirect VNPay
  const vnpayUrl = createVNPayUrl({
    orderId:     orderId,
    amount:      order.finalAmount !== undefined && order.finalAmount !== null ? order.finalAmount : order.totalAmount,
    description: `Thanh toan don hang #${orderId}`,
    ipAddr:      ipAddr,
  });

  return { vnpayUrl, paymentId: payment._id };
};

// ═══ 3. Xử lý Return URL từ VNPay (chỉ redirect, KHÔNG update DB) ════════════════
const handleVNPayReturn = (vnpayData) => {
  // Chỉ xác minh chữ ký và trả về kết quả để redirect — KHÔNG update DB
  const isValidSignature = verifyVNPaySignature(vnpayData);
  const responseCode = vnpayData.vnp_ResponseCode;
  const isSuccess = isValidSignature && responseCode === '00';

  return {
    isSuccess,
    isValidSignature,
    responseCode,
    orderId: vnpayData.vnp_TxnRef,
    transactionId: vnpayData.vnp_TransactionNo,
    amount: vnpayData.vnp_Amount ? parseInt(vnpayData.vnp_Amount) / 100 : 0,
  };
};

// ═══ 4. Xử lý IPN từ VNPay (API ngầm — đây là nơi DUY NHẤT update DB) ══════════
const handleVNPayIPN = async (vnpayData) => {
  // Bước 1: Xác minh chữ ký HMAC-SHA512
  const isValidSignature = verifyVNPaySignature(vnpayData);
  if (!isValidSignature) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const orderId       = vnpayData.vnp_TxnRef;
  const responseCode  = vnpayData.vnp_ResponseCode;
  const vnpayAmount   = parseInt(vnpayData.vnp_Amount) / 100; // VNPay gửi x100
  const transactionId = vnpayData.vnp_TransactionNo;
  const isSuccess     = responseCode === '00';

  // Bước 2: Query DB — tìm đơn hàng
  const order = await Order.findById(orderId);
  if (!order) {
    return { RspCode: '01', Message: 'Order not found' };
  }

  // Bước 3: Kiểm tra số tiền khớp
  const orderAmount = order.finalAmount !== undefined && order.finalAmount !== null
    ? order.finalAmount
    : order.totalAmount;

  if (Math.abs(vnpayAmount - orderAmount) > 1) { // Chênh lệch > 1đ thì từ chối
    return { RspCode: '04', Message: 'Invalid Amount' };
  }

  // Bước 4: Tìm payment record hiện tại
  const payment = await new Promise((resolve, reject) => {
    PaymentRepository.findByOrder(orderId, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!payment) {
    return { RspCode: '01', Message: 'Payment record not found' };
  }

  // Bước 5: Kiểm tra xem đã xử lý IPN này chưa (idempotent)
  if (payment.status === 'da_thanh_toan') {
    return { RspCode: '02', Message: 'Order already confirmed' };
  }

  // Bước 6: UPDATE DB — đây là hành động quan trọng nhất
  const updatedPayment = await new Promise((resolve, reject) => {
    PaymentRepository.updateById(payment._id, {
      status:             isSuccess ? 'da_thanh_toan' : 'that_bai',
      vnpayTransactionId: transactionId,
      vnpayResponseCode:  responseCode,
      paidAt:             isSuccess ? new Date() : null,
    }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (isSuccess) {
    // Cập nhật trạng thái đơn hàng
    await Order.findByIdAndUpdate(orderId, { orderStatus: 'dang_xu_ly' });

    // Tăng lượt sử dụng voucher (chỉ lần đầu)
    if (order.voucherCode) {
      await Voucher.updateOne(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // Emit socket real-time cho staff & bàn
    const io = getIO();
    if (io) {
      const freshOrder = await Order.findById(orderId);
      io.to('staff').emit('payment:success', {
        payment: updatedPayment,
        orderId,
        tableId: freshOrder?.table,
      });
      if (freshOrder?.table) {
        io.to(`table:${freshOrder.table}`).emit('payment:success', {
          payment: updatedPayment,
          orderId,
        });
      }
    }
  }

  // Trả về mã 00 cho VNPay để báo đã nhận thành công
  return { RspCode: '00', Message: 'Confirm Success' };
};

module.exports = { createOfflinePayment, createVNPayPayment, handleVNPayReturn, handleVNPayIPN };

