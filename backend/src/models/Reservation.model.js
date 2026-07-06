const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  variant:  { type: String, default: null },
  note:     { type: String, default: '' }
}, { _id: false });

const reservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  // Liên kết tài khoản User nếu khách đã đăng nhập (optional)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reservationDate: { type: Date, required: true },
  reservationTime: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1 },
  note: { type: String, default: '' },
  items: [reservationItemSchema],
  status: {
    type: String,
    enum: ['cho_xac_nhan', 'da_xac_nhan', 'hoan_thanh', 'da_huy'],
    default: 'cho_xac_nhan'
  },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
