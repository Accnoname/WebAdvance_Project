const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const mongoose = require('mongoose');

// Helper function: Lấy khoảng thời gian (startDate, endDate) dựa theo `period`
const getDateRange = (period, customFrom, customTo) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'week') {
    const day = now.getDay() || 7; // CN = 0 -> 7
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(0); // Ngày cuối của tháng
    end.setHours(23, 59, 59, 999);
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    start.setMonth(quarter * 3);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth((quarter + 1) * 3);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'custom' && customFrom && customTo) {
    start = new Date(customFrom);
    start.setHours(0, 0, 0, 0);
    end = new Date(customTo);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default: month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

const getRevenue = async (query) => {
  const { period, customFrom, customTo } = query;
  const { start, end } = getDateRange(period, customFrom, customTo);

  // Grouping format based on period
  let format = '%Y-%m-%d';
  if (period === 'today') format = '%H:00';
  else if (period === 'year') format = '%Y-%m';

  const pipeline = [
    {
      $match: {
        orderStatus: 'hoan_thanh',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt', timezone: '+07:00' } },
        amount: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ];

  const results = await Order.aggregate(pipeline);

  // Map result for chart
  const chartData = results.map(item => ({
    label: item._id,
    amount: item.amount,
    orders: item.orders
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);
  const aov = totalOrders > 0 ? Math.round(total / totalOrders) : 0;

  return {
    chartData,
    summary: { total, orders: totalOrders, aov }
  };
};

const getBestSellers = async (query) => {
  const limit = parseInt(query.limit) || 5;
  const { period, customFrom, customTo } = query;
  const { start, end } = getDateRange(period, customFrom, customTo);

  const pipeline = [
    {
      $match: {
        orderStatus: 'hoan_thanh',
        createdAt: { $gte: start, $lte: end }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItem',
        sold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { sold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'menuitems',
        localField: '_id',
        foreignField: '_id',
        as: 'menuItem'
      }
    },
    { $unwind: '$menuItem' },
    {
      $project: {
        _id: 0,
        id: '$_id',
        name: '$menuItem.name',
        sold: 1,
        revenue: 1
      }
    }
  ];

  return await Order.aggregate(pipeline);
};

const getDashboardStats = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Tổng số đơn hôm nay
  const totalOrdersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
  
  // Đơn hủy hôm nay
  const canceledOrdersToday = await Order.countDocuments({ 
    createdAt: { $gte: startOfDay },
    orderStatus: 'da_huy'
  });
  
  // Bàn đang phục vụ
  const activeTables = await Table.countDocuments({ status: 'dang_phuc_vu' });
  const totalTables = await Table.countDocuments();
  
  // Đơn chờ bếp (orderStatus = 'dang_xu_ly')
  const waitingOrders = await Order.countDocuments({ orderStatus: 'dang_xu_ly' });

  return {
    totalOrdersToday,
    canceledOrdersToday,
    cancelRate: totalOrdersToday > 0 ? ((canceledOrdersToday / totalOrdersToday) * 100).toFixed(1) : 0,
    activeTables,
    totalTables,
    occupancyRate: totalTables > 0 ? ((activeTables / totalTables) * 100).toFixed(1) : 0,
    waitingOrders
  };
};

module.exports = { getRevenue, getBestSellers, getDashboardStats };
