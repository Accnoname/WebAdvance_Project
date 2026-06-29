const Order = require('../models/Order.model');
const { createBaseRepository } = require('./base.repository');

const OrderRepository = {
  ...createBaseRepository(Order),

  findWithDetails: (id, callback) => {
    Order.findById(id)
      .populate('table')
      .populate('customer', '-password')
      .populate('items.menuItem')
      .exec(callback);
  },

  findByCustomer: async (customerId) =>
    Order.find({ customer: customerId }).sort({ createdAt: -1 })
};

module.exports = OrderRepository;
