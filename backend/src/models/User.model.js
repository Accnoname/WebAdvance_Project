const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, trim: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['quan_ly', 'nhan_vien', 'khach_hang'], default: 'khach_hang' },
  avatar:    { type: String, default: null },
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

// Loại bỏ password khi trả về JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
