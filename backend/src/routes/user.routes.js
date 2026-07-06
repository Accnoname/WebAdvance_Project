const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Chỉ Quan_ly mới được quản lý nhân viên
router.use(authenticate);
router.use(authorizeRole('quan_ly'));

router.get('/', UserController.getAllUsers);
router.post('/', UserController.createStaff);
router.patch('/:id', UserController.updateStaff);
router.delete('/:id', UserController.deleteStaff);

module.exports = router;
