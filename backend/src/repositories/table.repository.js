const Table = require('../models/Table.model');
const { createBaseRepository } = require('./base.repository');

const TableRepository = {
  ...createBaseRepository(Table),

  findByStatus: async (status) => Table.find({ status }),

  findByTableNumber: (tableNumber, callback) => {
    Table.findOne({ tableNumber }).exec(callback);
  },

  updateStatus: async (id, status, orderId = null) =>
    Table.findByIdAndUpdate(
      id,
      { status, currentOrder: orderId },
      { new: true }
    )
};

module.exports = TableRepository;
