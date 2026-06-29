const Payment = require('../models/Payment.model');
const { createBaseRepository } = require('./base.repository');

const PaymentRepository = {
  ...createBaseRepository(Payment),

  findByOrder: async (orderId) =>
    Payment.findOne({ order: orderId }).populate('order')
};

module.exports = PaymentRepository;
