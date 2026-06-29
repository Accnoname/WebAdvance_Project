const OrderRepository = require('../repositories/order.repository');
const { getIO } = require('../config/socket');

// TODO: Implement
const createOrder = async (orderData, user) => { throw new Error('TODO'); };
const updateStatus = async (orderId, status) => { throw new Error('TODO'); };
const updateItemStatus = async (orderId, itemId, status) => { throw new Error('TODO'); };

module.exports = { createOrder, updateStatus, updateItemStatus };
