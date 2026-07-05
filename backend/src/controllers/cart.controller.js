const CartService = require('../services/cart.service');
const { sendSuccess } = require('../utils/response.util');

// Lấy giỏ hàng của user hiện tại
const getCart = async (req, res, next) => {
  try {
    const cart = await CartService.getCart(req.user._id);
    res.status(200).json(sendSuccess('Lấy giỏ hàng thành công', cart));
  } catch (error) {
    next(error);
  }
};

// Cập nhật toàn bộ giỏ hàng
const syncCart = async (req, res, next) => {
  try {
    const { items, tableId, orderType, deliveryAddress, deliveryPhone } = req.body;
    const updatedCart = await CartService.updateCartData(req.user._id, {
      items,
      tableId,
      orderType,
      deliveryAddress,
      deliveryPhone
    });
    res.status(200).json(sendSuccess('Đồng bộ giỏ hàng thành công', updatedCart));
  } catch (error) {
    next(error);
  }
};

// Làm trống giỏ hàng
const clearCart = async (req, res, next) => {
  try {
    const cart = await CartService.clearCart(req.user._id);
    res.status(200).json(sendSuccess('Đã làm trống giỏ hàng', cart));
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, syncCart, clearCart };
