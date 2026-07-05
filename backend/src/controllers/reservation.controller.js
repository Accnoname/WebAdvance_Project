const ReservationService = require('../services/reservation.service');
const { sendSuccess } = require('../utils/response.util');

const create = async (req, res, next) => {
  try {
    const data = await ReservationService.create(req.body);
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
    const data = await ReservationService.getAll({ customerPhone: req.user.phone });
    res.status(200).json(sendSuccess('Danh sách đặt bàn của tôi', data));
  } catch (error) { next(error); }
};

module.exports = { create, getAll, updateStatus, getMyReservations };
