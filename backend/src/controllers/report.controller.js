const ReportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response.util');

const getRevenue = async (req, res, next) => {
  try {
    const data = await ReportService.getRevenue(req.query);
    res.status(200).json(sendSuccess('Báo cáo doanh thu', data));
  } catch (error) { next(error); }
};

const getBestSellers = async (req, res, next) => {
  try {
    const data = await ReportService.getBestSellers();
    res.status(200).json(sendSuccess('Món bán chạy', data));
  } catch (error) { next(error); }
};

module.exports = { getRevenue, getBestSellers };
