const express = require('express');
const router = express.Router();

router.use('/auth',     require('./auth.routes'));
router.use('/menu',     require('./menu.routes'));
router.use('/tables',   require('./table.routes'));
router.use('/reservations', require('./reservation.routes'));
router.use('/orders',   require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/reports',  require('./report.routes'));
router.use('/cart',     require('./cart.routes'));
router.use('/vouchers', require('./voucher.routes'));
router.use('/users',    require('./user.routes'));

module.exports = router;
