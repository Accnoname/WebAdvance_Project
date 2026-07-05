const Cart = require('../models/Cart.model');

const findByUserId = (userId, callback) => {
  Cart.findOne({ user: userId })
    .populate('items.menuItem')
    .populate('tableId')
    .then(cart => callback(null, cart))
    .catch(err => callback(err));
};

const createOrUpdate = (userId, cartData, callback) => {
  Cart.findOneAndUpdate(
    { user: userId },
    { ...cartData, user: userId },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('items.menuItem')
    .populate('tableId')
    .then(cart => callback(null, cart))
    .catch(err => callback(err));
};

const clearCart = (userId, callback) => {
  Cart.findOneAndUpdate(
    { user: userId },
    { items: [] },
    { new: true }
  )
    .then(cart => callback(null, cart))
    .catch(err => callback(err));
};

module.exports = { findByUserId, createOrUpdate, clearCart };
