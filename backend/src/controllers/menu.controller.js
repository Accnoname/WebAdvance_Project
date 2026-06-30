const MenuService = require('../services/menu.service');
const { sendSuccess, sendPaginated } = require('../utils/response.util');

const getAll = async (req, res, next) => {
  try {
    const result = await MenuService.getAll(req.query);
    res.status(200).json(sendPaginated('Danh sách menu', result.data, result));
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const data = await MenuService.getById(req.params.id);
    res.status(200).json(sendSuccess('Chi tiết món', data));
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = await MenuService.create(req.body, req.file);
    res.status(201).json(sendSuccess('Thêm món thành công', data, 201));
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const data = await MenuService.update(req.params.id, req.body, req.file);
    res.status(200).json(sendSuccess('Cập nhật món thành công', data));
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await MenuService.remove(req.params.id);
    res.status(200).json(sendSuccess('Xóa món thành công'));
  } catch (error) { next(error); }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const data = await MenuService.toggleAvailability(req.params.id);
    res.status(200).json(sendSuccess('Cập nhật trạng thái món', data));
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, toggleAvailability };
