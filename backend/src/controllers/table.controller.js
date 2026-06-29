const TableService = require('../services/table.service');
const { sendSuccess } = require('../utils/response.util');

const getAll = async (req, res, next) => {
  try {
    const data = await TableService.getAll();
    res.status(200).json(sendSuccess('Danh sách bàn', data));
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

module.exports = { getAll, create, updateStatus };
