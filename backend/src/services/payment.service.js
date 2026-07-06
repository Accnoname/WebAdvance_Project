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

// ─── 3. Xử lý callback từ VNPay (sau khi khách thanh toán) ─────────────────
const handleVNPayCallback = async (vnpayData) => {
  // Bước 1: Xác minh chữ ký HMAC-SHA512 — chống giả mạo
  const isValidSignature = verifyVNPaySignature(vnpayData);
  if (!isValidSignature) {
    throw new AppError('Chữ ký VNPay không hợp lệ', 400);
  }

  const orderId        = vnpayData.vnp_TxnRef;
  const responseCode   = vnpayData.vnp_ResponseCode;
  const transactionId  = vnpayData.vnp_TransactionNo;
  const isSuccess      = responseCode === '00';

  // Bước 2: Tìm payment record tương ứng
  const payment = await new Promise((resolve, reject) => {
    PaymentRepository.findByOrder(orderId, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!payment) throw new AppError('Không tìm thấy thông tin thanh toán', 404);

  // Bước 3: Cập nhật trạng thái payment
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

  // Bước 4: Nếu thành công → cập nhật trạng thái đơn hàng
  if (isSuccess) {
    const isFirstTimePaid = payment.status !== 'da_thanh_toan';

    await Order.findByIdAndUpdate(orderId, {
      orderStatus: 'dang_xu_ly', // Đã thanh toán, bếp bắt đầu làm
    });

    // Bước 5: Emit socket thông báo real-time
    const order = await Order.findById(orderId);

    // Tăng lượt sử dụng của voucher nếu là lần đầu thanh toán thành công
    if (isFirstTimePaid && order && order.voucherCode) {
      await Voucher.updateOne({ code: order.voucherCode.toUpperCase() }, { $inc: { usedCount: 1 } });
    }

    const io = getIO();
    if (io) {
      io.to('staff').emit('payment:success', {
        payment: updatedPayment,
        orderId,
        tableId: order?.table,
      });
      io.to(`table:${order?.table}`).emit('payment:success', {
        payment: updatedPayment,
        orderId,
      });
    }
  }

  return {
    isSuccess,
    payment: updatedPayment,
    responseCode,
  };
};

module.exports = { createOfflinePayment, createVNPayPayment, handleVNPayCallback };
