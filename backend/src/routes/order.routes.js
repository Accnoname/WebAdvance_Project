const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Tất cả route đơn hàng yêu cầu đăng nhập
router.use(authenticate);

// Route khách hàng
router.post('/', OrderController.create);
router.get('/my-orders', OrderController.getMyOrders);
// [M2] Khách xem chi tiết đơn của chính mình (service kiểm tra ownership)
router.get('/my-orders/:id', OrderController.getMyOrderById);
router.post('/my-orders/:id/review', OrderController.submitReview);

// Route nhân viên & quản lý
router.get('/', authorizeRole('nhan_vien', 'quan_ly'), OrderController.getAll);
router.get('/:id', authorizeRole('nhan_vien', 'quan_ly'), OrderController.getById);
router.patch('/:id/status', authorizeRole('nhan_vien', 'quan_ly'), OrderController.updateStatus);
router.post('/:id/items', authorizeRole('nhan_vien', 'quan_ly'), OrderController.addItems);
router.patch('/:id/items/:itemId/status', authorizeRole('nhan_vien', 'quan_ly'), OrderController.updateItemStatus);

module.exports = router;
