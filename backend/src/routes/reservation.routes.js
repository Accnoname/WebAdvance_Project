const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/reservation.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Public: Khách hàng đặt bàn (không cần đăng nhập)
router.post('/', ReservationController.create);

// Protected: Khách hàng xem đặt bàn của mình
router.get('/my', authenticate, ReservationController.getMyReservations);

// Protected: Chỉ nhân viên & quản lý xem và duyệt
router.get('/', authenticate, authorizeRole('nhan_vien', 'quan_ly'), ReservationController.getAll);
router.patch('/:id/status', authenticate, authorizeRole('nhan_vien', 'quan_ly'), ReservationController.updateStatus);

module.exports = router;
