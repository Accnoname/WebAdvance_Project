const express = require('express');
const router = express.Router();
const TableController = require('../controllers/table.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Public routes
router.get('/',                  TableController.getAll);
router.get('/availability',      TableController.getAvailability); // Kiểm tra tình trạng bàn theo ngày/giờ

// Staff & Manager routes
router.post('/',              authenticate, authorizeRole('quan_ly'), TableController.create);
router.patch('/:id/status',   authenticate, authorizeRole('nhan_vien', 'quan_ly'), TableController.updateStatus);
router.delete('/:id',         authenticate, authorizeRole('quan_ly'), TableController.deleteTable);

module.exports = router;
