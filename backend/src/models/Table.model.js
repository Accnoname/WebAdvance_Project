const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber:  { type: Number, required: true, unique: true },
  capacity:     { type: Number, required: true },
  status:       {
    type: String,
    enum: ['trong', 'dang_phuc_vu', 'dat_truoc', 'dong'],
    default: 'trong'
  },
  area: {
    type: String,
    enum: ['window', 'garden', 'vip', 'main'],
    default: 'main'
  },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  qrCode:       { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
