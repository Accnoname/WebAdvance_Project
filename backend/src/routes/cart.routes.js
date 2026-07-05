const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Mọi thao tác giỏ hàng đều cần đăng nhập
router.use(authenticate);

router.get('/', cartController.getCart);
router.put('/sync', cartController.syncCart);
router.delete('/', cartController.clearCart);

module.exports = router;
