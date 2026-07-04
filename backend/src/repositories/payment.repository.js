const Payment = require('../models/Payment.model');
const { createBaseRepository } = require('./base.repository');

const PaymentRepository = {
  ...createBaseRepository(Payment),

  // Tìm payment theo orderId — error-first callback theo convention
  findByOrder: (orderId, callback) => {
    Payment.findOne({ order: orderId })
      .populate('order')
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  }
};

module.exports = PaymentRepository;
