const express = require('express');
const router = express.Router();
const VoucherController = require('../controllers/voucher.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// All voucher routes require authentication
router.use(authenticate);

// Client-accessible routes (must be registered before admin authorizeRole)
router.get('/client/available', VoucherController.getAvailableVouchers);

// Validate voucher for an order
router.post('/validate', VoucherController.validate);

// Look up voucher details by code
router.get('/code/:code', VoucherController.getByCode);

// Manager-only CRUD routes
router.post('/', authorizeRole('quan_ly'), VoucherController.create);
router.get('/', authorizeRole('quan_ly'), VoucherController.getAll);
router.get('/:id', authorizeRole('quan_ly'), VoucherController.getById);
router.put('/:id', authorizeRole('quan_ly'), VoucherController.update);
router.delete('/:id', authorizeRole('quan_ly'), VoucherController.remove);

module.exports = router;
