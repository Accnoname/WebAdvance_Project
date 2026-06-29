const OrderService = require('../services/order.service');
const { sendSuccess } = require('../utils/response.util');

const getAll = async (req, res, next) => {
  try {
    // TODO
    res.status(200).json(sendSuccess('Danh sách đơn hàng', []));
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const order = await OrderService.createOrder(req.body, req.user);
    res.status(201).json(sendSuccess('Tạo đơn hàng thành công', order, 201));
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const order = await OrderService.updateStatus(req.params.id, req.body.status);
    res.status(200).json(sendSuccess('Cập nhật trạng thái thành công', order));
  } catch (error) { next(error); }
};

module.exports = { getAll, create, updateStatus };
