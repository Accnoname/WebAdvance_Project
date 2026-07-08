const express = require('express');
const router = express.Router();
const VoucherController = require('../controllers/voucher.controller');
const { authenticate, optionalAuthenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Client-accessible routes (cho phép guest)
router.get('/client/available', optionalAuthenticate, VoucherController.getAvailableVouchers);

// Validate voucher for an order (cho phép guest)
router.post('/validate', optionalAuthenticate, VoucherController.validate);

// All other voucher routes require authentication
router.use(authenticate);

// Look up voucher details by code
router.get('/code/:code', VoucherController.getByCode);

// Manager-only CRUD routes
router.post('/', authorizeRole('quan_ly'), VoucherController.create);
router.get('/', authorizeRole('quan_ly'), VoucherController.getAll);
router.get('/:id', authorizeRole('quan_ly'), VoucherController.getById);
router.put('/:id', authorizeRole('quan_ly'), VoucherController.update);
router.delete('/:id', authorizeRole('quan_ly'), VoucherController.remove);

module.exports = router;
