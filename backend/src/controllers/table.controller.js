const TableService = require('../services/table.service');
const { sendSuccess } = require('../utils/response.util');

const getAll = async (req, res, next) => {
  try {
    const data = await TableService.getAll();
    res.status(200).json(sendSuccess('Danh sách bàn', data));
  } catch (error) { next(error); }
};

const getAvailability = async (req, res, next) => {
  try {
    const { date, time } = req.query;
    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Thiếu thông số date và time' });
    }
    const data = await TableService.checkAvailability(date, time);
    res.status(200).json(sendSuccess('Tình trạng bàn', data));
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = await TableService.create(req.body);
    res.status(201).json(sendSuccess('Thêm bàn thành công', data, 201));
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await TableService.updateStatus(req.params.id, req.body.status);
    res.status(200).json(sendSuccess('Cập nhật trạng thái bàn', data));
  } catch (error) { next(error); }
};

const deleteTable = async (req, res, next) => {
  try {
    const data = await TableService.remove(req.params.id);
    res.status(200).json(sendSuccess('Xóa bàn thành công', data));
  } catch (error) { next(error); }
};

module.exports = { getAll, getAvailability, create, updateStatus, deleteTable };
