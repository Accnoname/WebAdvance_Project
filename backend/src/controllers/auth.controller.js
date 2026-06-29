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

module.exports = { register, login, getMe };
