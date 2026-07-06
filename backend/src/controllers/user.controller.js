const UserService = require('../services/user.service');
const { sendSuccess } = require('../utils/response.util');

const getAllUsers = async (req, res, next) => {
  try {
    const data = await UserService.getAllUsers(req.query);
    res.status(200).json(sendSuccess('Danh sách tài khoản', data));
  } catch (error) { next(error); }
};

const createStaff = async (req, res, next) => {
  try {
    const data = await UserService.createStaff(req.body);
    res.status(201).json(sendSuccess('Tạo tài khoản thành công', data, 201));
  } catch (error) { next(error); }
};

const updateStaff = async (req, res, next) => {
  try {
    const data = await UserService.updateStaff(req.params.id, req.body);
    res.status(200).json(sendSuccess('Cập nhật tài khoản thành công', data));
  } catch (error) { next(error); }
};

const deleteStaff = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user._id : null;
    const data = await UserService.deleteStaff(req.params.id, currentUserId);
    res.status(200).json(sendSuccess('Xóa tài khoản thành công', data));
  } catch (error) { next(error); }
};

module.exports = { getAllUsers, createStaff, updateStaff, deleteStaff };
