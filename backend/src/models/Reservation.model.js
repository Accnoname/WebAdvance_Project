const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  reservationDate: { type: Date, required: true },
  reservationTime: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1 },
  note: { type: String, default: '' },
  status: {
    type: String,
    enum: ['cho_xac_nhan', 'da_xac_nhan', 'hoan_thanh', 'da_huy'],
    default: 'cho_xac_nhan'
  },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
