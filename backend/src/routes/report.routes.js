const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const { authenticate, authorizeRole } = require('../middlewares/auth.middleware');

router.get('/revenue',      authenticate, authorizeRole('quan_ly'), ReportController.getRevenue);
router.get('/best-sellers', authenticate, authorizeRole('quan_ly'), ReportController.getBestSellers);

module.exports = router;
