const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  note:     { type: String, default: '' },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items:           [cartItemSchema],
  tableId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  orderType:       { type: String, enum: ['tai_ban', 'giao_hang', 'mang_ve'], default: 'tai_ban' },
  deliveryAddress: { type: String, default: '' },
  deliveryPhone:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
