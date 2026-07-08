const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },   // snapshot giá lúc đặt
  note:     { type: String, default: '' },
  variant:  { type: String, default: null },
  status:   {
    type: String,
    enum: ['cho_xac_nhan', 'dang_che_bien', 'cho_phuc_vu', 'hoan_thanh', 'huy'],
    default: 'cho_xac_nhan'
  }
});

const orderSchema = new mongoose.Schema({
  orderType:       { type: String, enum: ['tai_ban', 'mang_ve', 'giao_hang'], default: 'tai_ban' },
  table:           { type: mongoose.Schema.Types.ObjectId, ref: 'Table' }, // Optional
  deliveryAddress: { type: String, default: null }, // Cho giao hàng
  deliveryPhone:   { type: String, default: null }, // Cho giao hàng
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items:           [orderItemSchema],
  orderStatus: {
    type: String,
    enum: ['moi', 'dang_xu_ly', 'hoan_thanh', 'da_huy'],
    default: 'moi'
  },
  paymentMethod: {
    type: String,
    enum: ['tien_mat', 'chuyen_khoan', 'vnpay', 'khac'],
    default: 'tien_mat'
  },
  isPaid: { type: Boolean, default: false },
  totalAmount: { type: Number, required: true },
  voucherCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  note:        { type: String, default: '' },
  orderedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  review: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    reviewedAt: { type: Date, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
