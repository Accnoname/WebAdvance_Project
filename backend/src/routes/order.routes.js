const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

router.get('/',             authenticate, authorizeRole('nhan_vien', 'quan_ly'), OrderController.getAll);
router.post('/',            authenticate, OrderController.create);
router.patch('/:id/status', authenticate, authorizeRole('nhan_vien', 'quan_ly'), OrderController.updateStatus);

module.exports = router;
