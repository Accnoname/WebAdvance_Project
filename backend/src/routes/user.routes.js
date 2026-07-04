const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

// Chỉ Quan_ly mới được quản lý nhân viên
router.use(authenticate);
router.use(authorizeRole('quan_ly'));

router.get('/staff', UserController.getStaff);
router.post('/staff', UserController.createStaff);
router.patch('/staff/:id', UserController.updateStaff);
router.delete('/staff/:id', UserController.deleteStaff);

module.exports = router;
