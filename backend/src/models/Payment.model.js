const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order:               { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount:              { type: Number, required: true },
  method:              { type: String, enum: ['tien_mat', 'chuyen_khoan', 'vnpay'], required: true },
  status:              {
    type: String,
    enum: ['cho_thanh_toan', 'da_thanh_toan', 'that_bai', 'hoan_tien'],
    default: 'cho_thanh_toan'
  },
  vnpayTransactionId:  { type: String, default: null },
  vnpayResponseCode:   { type: String, default: null },
  paidAt:              { type: Date, default: null },
  processedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
