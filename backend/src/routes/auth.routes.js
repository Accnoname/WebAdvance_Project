const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);
router.post('/create-staff', authenticate, authorizeRole('quan_ly'), AuthController.register);

module.exports = router;
