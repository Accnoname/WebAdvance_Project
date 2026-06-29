const Table = require('../models/Table.model');
const { createBaseRepository } = require('./base.repository');

const TableRepository = {
  ...createBaseRepository(Table),

  findByStatus: async (status) => Table.find({ status }),

  updateStatus: async (id, status, orderId = null) =>
    Table.findByIdAndUpdate(
      id,
      { status, currentOrder: orderId },
      { new: true }
    )
};

module.exports = TableRepository;
