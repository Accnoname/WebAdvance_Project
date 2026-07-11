const CartRepository = require('../repositories/cart.repository');

const getCart = async (userId) => {
  return new Promise((resolve, reject) => {
    CartRepository.findByUserId(userId, (err, cart) => {
      if (err) return reject(err);
      if (!cart) {
        // Trả về giỏ hàng rỗng nếu chưa có
        return resolve({
          user: userId,
          items: [],
          tableId: null
        });
      }
      resolve(cart);
    });
  });
};

const updateCartData = async (userId, cartData) => {
  return new Promise((resolve, reject) => {
    CartRepository.createOrUpdate(userId, cartData, (err, updatedCart) => {
      if (err) return reject(err);
      resolve(updatedCart);
    });
  });
};

const clearCart = async (userId) => {
  return new Promise((resolve, reject) => {
    CartRepository.clearCart(userId, (err, cart) => {
      if (err) return reject(err);
      resolve(cart);
    });
  });
};

module.exports = { getCart, updateCartData, clearCart };
