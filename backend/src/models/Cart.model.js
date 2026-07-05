const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  note:     { type: String, default: '' },
  variant:  { type: String, default: null }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items:           [cartItemSchema],
  tableId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  orderType:       { type: String, enum: ['tai_ban', 'mang_ve', 'giao_hang'], default: 'tai_ban' },
  deliveryAddress: { type: String, default: '' },
  deliveryPhone:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
