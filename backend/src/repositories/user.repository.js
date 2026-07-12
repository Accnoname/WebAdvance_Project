const User = require('../models/User.model');
const { createBaseRepository } = require('./base.repository');

const UserRepository = {
  ...createBaseRepository(User),

  findByEmail: (email, callback) => {
    User.findOne({ email })
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  },

  findByEmailWithPassword: (email, callback) => {
    User.findOne({ email }).select('+password')
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  },

  // Tìm user có reset token hợp lệ và chưa hết hạn
  findByResetToken: (token, callback) => {
    User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  }
};

module.exports = UserRepository;
