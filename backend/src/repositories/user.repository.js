const User = require('../models/User.model');
const { createBaseRepository } = require('./base.repository');

const UserRepository = {
  ...createBaseRepository(User),

  findByEmail: (email, callback) => {
    User.findOne({ email }).exec((err, doc) => {
      if (err) return callback(err);
      callback(null, doc);
    });
  },

  findByEmailWithPassword: (email, callback) => {
    User.findOne({ email }).select('+password').exec((err, doc) => {
      if (err) return callback(err);
      callback(null, doc);
    });
  }
};

module.exports = UserRepository;
