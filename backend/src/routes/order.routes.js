const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Public route for creating orders (guest scanning QR)
router.post('/', OrderController.create);

// Routes for authenticated users
router.use(authenticate);

// Customer routes
router.get('/my-orders', OrderController.getMyOrders);

// Staff & Manager routes
router.get('/', authorizeRole('nhan_vien', 'quan_ly'), OrderController.getAll);
router.get('/:id', authorizeRole('nhan_vien', 'quan_ly'), OrderController.getById);
router.patch('/:id/status', authorizeRole('nhan_vien', 'quan_ly'), OrderController.updateStatus);
router.patch('/:id/items/:itemId/status', authorizeRole('nhan_vien', 'quan_ly'), OrderController.updateItemStatus);

module.exports = router;
