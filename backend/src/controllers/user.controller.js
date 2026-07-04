const UserService = require('../services/user.service');
const { sendSuccess } = require('../utils/response.util');

const getStaff = async (req, res, next) => {
  try {
    const data = await UserService.getStaff();
    res.status(200).json(sendSuccess('Danh sách nhân viên', data));
  } catch (error) { next(error); }
};

const createStaff = async (req, res, next) => {
  try {
    const data = await UserService.createStaff(req.body);
    res.status(201).json(sendSuccess('Tạo tài khoản nhân viên thành công', data, 201));
  } catch (error) { next(error); }
};

const updateStaff = async (req, res, next) => {
  try {
    const data = await UserService.updateStaff(req.params.id, req.body);
    res.status(200).json(sendSuccess('Cập nhật nhân viên thành công', data));
  } catch (error) { next(error); }
};

const deleteStaff = async (req, res, next) => {
  try {
    const data = await UserService.deleteStaff(req.params.id);
    res.status(200).json(sendSuccess('Xóa nhân viên thành công', data));
  } catch (error) { next(error); }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
