const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menu.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/',           MenuController.getAll);
router.get('/:id',        MenuController.getById);
router.post('/',          authenticate, authorizeRole('quan_ly'), upload.single('image'), MenuController.create);
router.put('/:id',        authenticate, authorizeRole('quan_ly'), upload.single('image'), MenuController.update);
router.delete('/:id',     authenticate, authorizeRole('quan_ly'), MenuController.remove);
router.patch('/:id/availability', authenticate, authorizeRole('quan_ly', 'nhan_vien'), MenuController.toggleAvailability);

module.exports = router;
