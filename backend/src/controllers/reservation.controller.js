const ReservationService = require('../services/reservation.service');
const { sendSuccess } = require('../utils/response.util');
const jwt = require('jsonwebtoken');

const create = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Optional Auth: Gán user vào reservation nếu khách đã đăng nhập
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fix: JWT được tạo với _id (không phải id)
        if (decoded._id) payload.user = decoded._id;
      } catch (err) {
        // Token invalid/expired — bỏ qua, tạo reservation không cần user
      }
    }

    const data = await ReservationService.create(payload);
    res.status(201).json(sendSuccess('Tạo yêu cầu đặt bàn thành công', data, 201));
  } catch (error) { next(error); }
};

const getAll = async (req, res, next) => {
  try {
    const data = await ReservationService.getAll(req.query);
    res.status(200).json(sendSuccess('Danh sách đặt bàn', data));
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, tableId } = req.body;
    const data = await ReservationService.updateStatus(req.params.id, status, tableId);
    res.status(200).json(sendSuccess('Cập nhật đơn đặt bàn thành công', data));
  } catch (error) { next(error); }
};

const getMyReservations = async (req, res, next) => {
  try {
    // Fix: JWT decode ra _id không phải id
    const conditions = [{ user: req.user._id }];
    if (req.user.phone) {
      conditions.push({ customerPhone: req.user.phone });
    }

    const data = await ReservationService.getAll({ $or: conditions });
    res.status(200).json(sendSuccess('Danh sách đặt bàn của tôi', data));
  } catch (error) { next(error); }
};

module.exports = { create, getAll, updateStatus, getMyReservations };
