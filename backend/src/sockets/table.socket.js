const emitTableStatusChanged = (io, tableId, status) => {
  io.emit('table:status-changed', { tableId, status });
};

module.exports = { emitTableStatusChanged };
