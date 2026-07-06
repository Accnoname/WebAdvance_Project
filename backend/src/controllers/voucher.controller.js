const VoucherService = require('../services/voucher.service');
const { sendSuccess, sendPaginated } = require('../utils/response.util');

const validate = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await VoucherService.validateVoucher(code, orderAmount);
    res.status(200).json(sendSuccess('Kiểm tra mã giảm giá thành công', result));
  } catch (error) {
    next(error);
  }
};

const getByCode = async (req, res, next) => {
  try {
    const voucher = await VoucherService.getByCode(req.params.code);
    res.status(200).json(sendSuccess('Thông tin mã giảm giá', voucher));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const createdBy = req.user ? req.user._id : null;
    const voucher = await VoucherService.create({ ...req.body, createdBy });
    res.status(201).json(sendSuccess('Tạo mã giảm giá thành công', voucher, 201));
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { data, total, page, limit } = await VoucherService.getAll(req.query);
    res.status(200).json(sendPaginated('Danh sách mã giảm giá', data, { total, page, limit }));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const voucher = await VoucherService.getById(req.params.id);
    res.status(200).json(sendSuccess('Chi tiết mã giảm giá', voucher));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const voucher = await VoucherService.update(req.params.id, req.body);
    res.status(200).json(sendSuccess('Cập nhật mã giảm giá thành công', voucher));
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const voucher = await VoucherService.remove(req.params.id);
    res.status(200).json(sendSuccess('Xóa mã giảm giá thành công', voucher));
  } catch (error) {
    next(error);
  }
};

const getAvailableVouchers = async (req, res, next) => {
  try {
    const vouchers = await VoucherService.getAvailableVouchers();
    res.status(200).json(sendSuccess('Danh sách mã giảm giá khả dụng', vouchers));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validate,
  getByCode,
  create,
  getAll,
  getById,
  update,
  remove,
  getAvailableVouchers
};
