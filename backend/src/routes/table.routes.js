const express = require('express');
const router = express.Router();
const TableController = require('../controllers/table.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

router.get('/',               TableController.getAll);
router.post('/',              authenticate, authorizeRole('quan_ly'), TableController.create);
router.patch('/:id/status',   authenticate, authorizeRole('nhan_vien', 'quan_ly'), TableController.updateStatus);

module.exports = router;
