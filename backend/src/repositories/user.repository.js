const User = require('../models/User.model');
const { createBaseRepository } = require('./base.repository');

const UserRepository = {
  ...createBaseRepository(User),

  findByEmail: (email, callback) => {
    User.findOne({ email }).exec(callback);
  },

  findByEmailWithPassword: async (email) =>
    User.findOne({ email }).select('+password')
};

module.exports = UserRepository;
