const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Table = require('../models/Table.model');

const updateAreas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const tables = await Table.find().sort({ tableNumber: 1 });
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (table.tableNumber <= 2) table.area = 'window';
      else if (table.tableNumber <= 4) table.area = 'garden';
      else if (table.tableNumber <= 6) table.area = 'vip';
      else table.area = 'main';
      await table.save();
    }
    console.log('✅ Cập nhật khu vực cho bàn thành công');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
};

updateAreas();
