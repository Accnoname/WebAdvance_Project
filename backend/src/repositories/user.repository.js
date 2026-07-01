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
  }
};

module.exports = UserRepository;
