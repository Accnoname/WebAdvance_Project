// Order socket events — được emit từ OrderService
// File này chứa các helper để tổ chức socket logic

const emitNewOrder = (io, order) => {
  io.to('kitchen').emit('order:new', order);
  io.to('staff').emit('order:new', order);
};

const emitOrderItemUpdated = (io, tableId, payload) => {
  io.to(`table:${tableId}`).emit('order:item-updated', payload);
  io.to('staff').emit('order:item-updated', payload);
};

const emitOrderStatusChanged = (io, tableId, payload) => {
  io.to(`table:${tableId}`).emit('order:status-changed', payload);
  io.to('kitchen').emit('order:status-changed', payload);
};

module.exports = { emitNewOrder, emitOrderItemUpdated, emitOrderStatusChanged };
