const AuthService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(sendSuccess('Đăng ký thành công', result, 201));
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.status(200).json(sendSuccess('Đăng nhập thành công', result));
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json(sendSuccess('Thông tin người dùng', req.user));
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await AuthService.updateProfile(req.user._id, req.body);
    res.status(200).json(sendSuccess('Cập nhật thông tin cá nhân thành công', result));
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await AuthService.changePassword(req.user._id, req.body);
    res.status(200).json(sendSuccess('Thay đổi mật khẩu thành công', result));
  } catch (error) { next(error); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    res.status(200).json(sendSuccess('Yêu cầu đặt lại mật khẩu', result));
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, otp, newPassword);
    res.status(200).json(sendSuccess('Đặt lại mật khẩu thành công', result));
  } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };
