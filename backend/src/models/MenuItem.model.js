const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category:    { type: String, enum: ['khai_vi', 'chinh', 'trang_mieng', 'nuoc'], required: true },
  price:       { type: Number, required: true, min: 0 },
  image:       { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
  prepareTime: { type: Number, default: 15 }, // phút
  variants:    [{ type: String }], // Mảng các vị, ví dụ: ['Dâu', 'Vani']
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
