const PaymentRepository = require('../repositories/payment.repository');
const { createVNPayUrl, verifyVNPaySignature } = require('../utils/vnpay.util');
const { AppError } = require('../middlewares/error.middleware');
const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const Voucher = require('../models/Voucher.model');
const { getIO } = require('../config/socket');

// ─── 1. Tạo thanh toán offline (tiền mặt) — Khách yêu cầu, Staff thu tiền ───
const createOfflinePayment = async (data) => {
  const { orderId, method, processedBy } = data;

  // Kiểm tra đơn hàng tồn tại
  const order = await Order.findById(orderId).populate('table');
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  // Chặn double payment
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
    // Đã có record → emit lại để staff biết, không tạo thêm
    const io = getIO();
    if (io) {
      io.to('staff').emit('payment:request', {
        orderId,
        paymentId: existingPayment._id,
        method: existingPayment.method,
        amount: existingPayment.amount,
        tableId: order.table?._id || order.table,
        tableNumber: order.table?.tableNumber,
      });
    }
    return existingPayment;
  }

  // Tính số tiền cần thanh toán
  const amount = (order.finalAmount != null) ? order.finalAmount : order.totalAmount;

  // Tạo record payment mới ở trạng thái "chờ thanh toán"
  // Staff sẽ xác nhận sau khi thu tiền thực tế
  const payment = await new Promise((resolve, reject) => {
    PaymentRepository.create({
      order:       orderId,
      amount,
      method:      method || 'tien_mat',
      status:      'cho_thanh_toan',
      processedBy: processedBy || null,
    }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  // Emit socket thông báo cho Staff biết có khách cần thu tiền
  const io = getIO();
  if (io) {
    io.to('staff').emit('payment:request', {
      orderId,
      paymentId: payment._id,
      method: method || 'tien_mat',
      amount,
      tableId: order.table?._id || order.table,
      tableNumber: order.table?.tableNumber,
    });
  }

  return payment;
};

// ─── 1b. Staff xác nhận đã thu tiền mặt → UPDATE DB + giải phóng bàn ─────────
const confirmOfflinePayment = async (orderId, processedBy, method = 'tien_mat') => {
  const order = await Order.findById(orderId).populate('table');
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  let payment = await new Promise((resolve, reject) => {
    PaymentRepository.findByOrder(orderId, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (payment && payment.status === 'da_thanh_toan') {
    throw new AppError('Đơn hàng này đã được thanh toán', 409);
  }

  let updatedPayment;
  if (!payment) {
    updatedPayment = await new Promise((resolve, reject) => {
      PaymentRepository.create({
        order: orderId,
        customer: order.customer,
        amount: order.finalAmount || order.totalAmount,
        method: method,
        status: 'da_thanh_toan',
        paidAt: new Date(),
        processedBy: processedBy || null,
      }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  } else {
    updatedPayment = await new Promise((resolve, reject) => {
      PaymentRepository.updateById(payment._id, {
        status:      'da_thanh_toan',
        method:      method,
        paidAt:      new Date(),
        processedBy: processedBy || null,
      }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  }

  order.isPaid = true;
  order.paymentMethod = method;
  await order.save();

  if (order.voucherCode) {
    await Voucher.updateOne(
      { code: order.voucherCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  const io = getIO();
  if (io) {
    io.to('staff').emit('payment:success', {
      payment: updatedPayment,
      orderId,
      method: method,
    });
    if (order.table) {
      const tableId = order.table?._id || order.table;
      io.to(`table:${tableId}`).emit('payment:success', { payment: updatedPayment, orderId });
    }
  }

  return updatedPayment;
};

// ─── 2. Tạo URL thanh toán VNPay ─────────────────────────────────────────────
const createVNPayPayment = async (orderId, ipAddr) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

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
    const amount = (order.finalAmount != null) ? order.finalAmount : order.totalAmount;
    payment = await new Promise((resolve, reject) => {
      PaymentRepository.create({
        order:  orderId,
        amount,
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

  // Số tiền gửi VNPay — PHẢI dùng đúng finalAmount
  const amount = (order.finalAmount != null) ? order.finalAmount : order.totalAmount;

  const vnpayUrl = createVNPayUrl({
    orderId:     orderId,
    amount,
    description: `Thanh toan don hang ${orderId}`,
    ipAddr:      ipAddr,
  });

  return { vnpayUrl, paymentId: payment._id };
};

// ─── 3. Return URL từ VNPay (chỉ redirect, KHÔNG update DB) ──────────────────
const handleVNPayReturn = (vnpayData) => {
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

// ─── 4. IPN từ VNPay (nơi DUY NHẤT update DB) ────────────────────────────────
const handleVNPayIPN = async (vnpayData) => {
  // Bước 1: Xác minh chữ ký HMAC-SHA512
  const isValidSignature = verifyVNPaySignature(vnpayData);
  if (!isValidSignature) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const orderId       = vnpayData.vnp_TxnRef;
  const responseCode  = vnpayData.vnp_ResponseCode;
  const vnpayAmount   = parseInt(vnpayData.vnp_Amount) / 100;
  const transactionId = vnpayData.vnp_TransactionNo;
  const isSuccess     = responseCode === '00';

  // Bước 2: Tìm đơn hàng
  const order = await Order.findById(orderId);
  if (!order) return { RspCode: '01', Message: 'Order not found' };

  // Bước 3: Kiểm tra số tiền
  const orderAmount = (order.finalAmount != null) ? order.finalAmount : order.totalAmount;
  if (Math.abs(vnpayAmount - orderAmount) > 1) {
    return { RspCode: '04', Message: 'Invalid Amount' };
  }

  // Bước 4: Tìm payment record
  const payment = await new Promise((resolve, reject) => {
    PaymentRepository.findByOrder(orderId, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!payment) return { RspCode: '01', Message: 'Payment record not found' };
  if (payment.status === 'da_thanh_toan') return { RspCode: '02', Message: 'Order already confirmed' };

  // Bước 5: UPDATE DB
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
    await Order.findByIdAndUpdate(orderId, { 
      isPaid: true,
      paymentMethod: 'vnpay'
    });

    if (order.voucherCode) {
      await Voucher.updateOne(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    const io = getIO();
    if (io) {
      const freshOrder = await Order.findById(orderId);
      io.to('staff').emit('payment:success', {
        payment: updatedPayment,
        orderId,
        tableId: freshOrder?.table,
        method: 'vnpay',
      });
      if (freshOrder?.table) {
        io.to(`table:${freshOrder.table}`).emit('payment:success', {
          payment: updatedPayment,
          orderId,
        });
      }
    }
  }

  return { RspCode: '00', Message: 'Confirm Success' };
};

module.exports = {
  createOfflinePayment,
  confirmOfflinePayment,
  createVNPayPayment,
  handleVNPayReturn,
  handleVNPayIPN,
};
