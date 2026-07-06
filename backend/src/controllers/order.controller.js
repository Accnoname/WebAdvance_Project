const OrderService = require('../services/order.service');
const { sendSuccess } = require('../utils/response.util');

const getAll = async (req, res, next) => {
  try {
    // [M4] Truyền query object (service sẽ sanitize), nhận về object có phân trang
    const result = await OrderService.getAll(req.query);
    res.status(200).json({
      success: true,
      message: 'Danh sách đơn hàng',
      data: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total }
    });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const data = await OrderService.getById(req.params.id);
    res.status(200).json(sendSuccess('Chi tiết đơn hàng', data));
  } catch (error) { next(error); }
};

const getMyOrders = async (req, res, next) => {
  try {
    const data = await OrderService.getMyOrders(req.user._id);
    res.status(200).json(sendSuccess('Lịch sử đơn hàng của bạn', data));
  } catch (error) { next(error); }
};

// [M2] Khách hàng xem chi tiết một đơn của chính mình
const getMyOrderById = async (req, res, next) => {
  try {
    const data = await OrderService.getMyOrderById(req.params.id, req.user._id);
    res.status(200).json(sendSuccess('Chi tiết đơn hàng', data));
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    // req.user might be undefined if not logged in (guest scanning QR)
    // For this simple system, allow guest orders
    const data = await OrderService.create(req.body, req.user);
    res.status(201).json(sendSuccess('Đặt món thành công', data, 201));
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await OrderService.updateStatus(req.params.id, req.body.status, req.body.paymentMethod);
    res.status(200).json(sendSuccess('Cập nhật trạng thái đơn hàng thành công', data));
  } catch (error) { next(error); }
};

const updateItemStatus = async (req, res, next) => {
  try {
    const data = await OrderService.updateItemStatus(req.params.id, req.params.itemId, req.body.status);
    res.status(200).json(sendSuccess('Cập nhật trạng thái món thành công', data));
  } catch (error) { next(error); }
};

const addItems = async (req, res, next) => {
  try {
    const data = await OrderService.addItems(req.params.id, req.body.items);
    res.status(200).json(sendSuccess('Thêm món vào đơn hàng thành công', data));
  } catch (error) { next(error); }
};

const submitReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const data = await OrderService.submitReview(req.params.id, req.user._id, rating, comment);
    res.status(200).json(sendSuccess('Gửi đánh giá đơn hàng thành công', data));
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, getMyOrders, getMyOrderById, create, updateStatus, updateItemStatus, addItems, submitReview };
