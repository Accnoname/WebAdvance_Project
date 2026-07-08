const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('../models/Order.model');
  require('../models/Table.model'); // đăng ký schema Table cho populate
  const orders = await Order.find({}).populate('table', 'tableNumber').select('orderType orderStatus table totalAmount createdAt');
  
  console.log(`\n📦 Tổng ${orders.length} orders:\n`);
  orders.forEach(o => {
    console.log(`  - ID: ...${o._id.toString().slice(-6)} | type: ${o.orderType} | status: ${o.orderStatus} | table: ${o.table ? `Bàn ${o.table.tableNumber}` : 'NULL'} | amount: ${o.totalAmount?.toLocaleString()}đ | ngày: ${o.createdAt?.toISOString().slice(0,10)}`);
  });
  process.exit(0);
}).catch(e => { console.error('❌', e.message); process.exit(1); });
