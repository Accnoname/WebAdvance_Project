const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },   // snapshot giá lúc đặt
  note:     { type: String, default: '' },
  status:   {
    type: String,
    enum: ['cho_xac_nhan', 'dang_che_bien', 'hoan_thanh', 'huy'],
    default: 'cho_xac_nhan'
  }
});

const orderSchema = new mongoose.Schema({
  table:       { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items:       [orderItemSchema],
  orderStatus: {
    type: String,
    enum: ['moi', 'dang_xu_ly', 'hoan_thanh', 'da_huy'],
    default: 'moi'
  },
  totalAmount: { type: Number, required: true },
  note:        { type: String, default: '' },
  orderedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
