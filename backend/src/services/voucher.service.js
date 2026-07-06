const VoucherRepository = require('../repositories/voucher.repository');
const { AppError } = require('../middlewares/error.middleware');

const create = async (data) => {
  const code = typeof data.code === 'string' ? data.code.toUpperCase() : '';
  
  const existingVoucher = await new Promise((resolve, reject) => {
    VoucherRepository.findByCode(code, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (existingVoucher) {
    throw new AppError('Mã giảm giá đã tồn tại', 409);
  }

  return await new Promise((resolve, reject) => {
    VoucherRepository.create({ ...data, code }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
};

const getAll = async (query = {}) => {
  const filter = {};
  if (query.isAvailable) {
    filter.isAvailable = query.isAvailable === 'true';
  }
  if (query.search) {
    filter.code = { $regex: query.search, $options: 'i' };
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const total = await new Promise((resolve, reject) => {
    VoucherRepository.count(filter, (err, count) => {
      if (err) return reject(err);
      resolve(count);
    });
  });

  const data = await new Promise((resolve, reject) => {
    VoucherRepository.findAll(filter, { skip, limit }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });

  return { data, total, page, limit };
};

const getById = async (id) => {
  const voucher = await new Promise((resolve, reject) => {
    VoucherRepository.findById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!voucher) {
    throw new AppError('Mã giảm giá không tồn tại', 404);
  }

  return voucher;
};

const getByCode = async (code) => {
  const voucher = await new Promise((resolve, reject) => {
    VoucherRepository.findByCode(code, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!voucher) {
    throw new AppError('Mã giảm giá không tồn tại', 404);
  }

  return voucher;
};

const update = async (id, data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
    const existing = await new Promise((resolve, reject) => {
      VoucherRepository.findByCode(data.code, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
    if (existing && existing._id.toString() !== id) {
      throw new AppError('Mã giảm giá đã tồn tại', 409);
    }
  }

  const updated = await new Promise((resolve, reject) => {
    VoucherRepository.updateById(id, data, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!updated) {
    throw new AppError('Mã giảm giá không tồn tại', 404);
  }

  return updated;
};

const remove = async (id) => {
  const deleted = await new Promise((resolve, reject) => {
    VoucherRepository.deleteById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!deleted) {
    throw new AppError('Mã giảm giá không tồn tại', 404);
  }

  return deleted;
};

const validateVoucher = async (code, orderAmount) => {
  const voucher = await new Promise((resolve, reject) => {
    VoucherRepository.findByCode(code, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!voucher) {
    throw new AppError('Mã giảm giá không tồn tại', 404);
  }

  if (!voucher.isAvailable) {
    throw new AppError('Mã giảm giá hiện không khả dụng', 400);
  }

  const now = new Date();
  if (now > new Date(voucher.expiryDate)) {
    throw new AppError('Mã giảm giá đã hết hạn sử dụng', 400);
  }

  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
    throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
  }

  if (orderAmount < voucher.minOrderAmount) {
    throw new AppError(`Đơn hàng tối thiểu phải từ ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này`, 400);
  }

  let discountAmount = 0;
  if (voucher.discountType === 'percentage') {
    discountAmount = Math.floor(orderAmount * (voucher.discountValue / 100));
  } else if (voucher.discountType === 'fixed') {
    discountAmount = voucher.discountValue;
  }

  // Capped at orderAmount, cannot be negative
  discountAmount = Math.max(0, Math.min(discountAmount, orderAmount));
  const finalAmount = orderAmount - discountAmount;

  return {
    voucherCode: voucher.code,
    discountAmount,
    finalAmount
  };
};

const getAvailableVouchers = async () => {
  const filter = {
    isAvailable: true,
    expiryDate: { $gt: new Date() }
  };
  const vouchers = await new Promise((resolve, reject) => {
    VoucherRepository.findAll(filter, { skip: 0, limit: 100 }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
  return vouchers.filter(v => v.maxUses === null || v.usedCount < v.maxUses);
};

module.exports = {
  create,
  getAll,
  getById,
  getByCode,
  update,
  remove,
  validateVoucher,
  getAvailableVouchers
};
