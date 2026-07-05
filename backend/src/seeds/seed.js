const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const QRCode = require('qrcode');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // 1. Xóa dữ liệu cũ
    await User.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🧹 Đã xóa dữ liệu cũ');

    // 2. Tạo tài khoản test (3 roles)
    const SALT_ROUNDS = 12;
    const users = [
      {
        name:     'Admin Nhà Hàng',
        email:    'admin@gmail.com',
        password: await bcrypt.hash('123456', SALT_ROUNDS),
        role:     'quan_ly',
        phone:    '0901234567',
        isActive: true,
      },
      {
        name:     'Nhân Viên Bếp',
        email:    'staff@gmail.com',
        password: await bcrypt.hash('123456', SALT_ROUNDS),
        role:     'nhan_vien',
        phone:    '0909876543',
        isActive: true,
      },
      {
        name:     'Khách Hàng',
        email:    'khach@gmail.com',
        password: await bcrypt.hash('123456', SALT_ROUNDS),
        role:     'khach_hang',
        phone:    '0912345678',
        isActive: true,
      },
    ];
    await User.insertMany(users);
    console.log(`✅ Đã tạo ${users.length} tài khoản test`);
    console.log('   👑 Quản lý  : admin@gmail.com / 123456');
    console.log('   👨‍🍳 Nhân viên: staff@gmail.com / 123456');
    console.log('   👤 Khách hàng: khach@gmail.com / 123456');

    // 3. Tạo dữ liệu Bàn
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const qrUrl = `${clientUrl}/menu?table=${i}`;
      let qrCode = null;
      try {
        qrCode = await QRCode.toDataURL(qrUrl);
      } catch (err) {
        console.error('Lỗi tạo QR:', err);
      }

      const getArea = (index) => {
        if (index <= 2) return 'window';
        if (index <= 4) return 'garden';
        if (index <= 6) return 'vip';
        return 'main';
      };

      tables.push({
        tableNumber: i,
        capacity: i <= 4 ? 2 : (i <= 8 ? 4 : 8),
        status: i === 3 ? 'dang_phuc_vu' : (i === 5 ? 'dat_truoc' : 'trong'),
        area: getArea(i),
        qrCode
      });
    }
    await Table.insertMany(tables);
    console.log(`✅ Đã tạo ${tables.length} bàn ăn`);

    // 4. Tạo dữ liệu Món ăn
    const menuItems = require('./menuData');
    await MenuItem.insertMany(menuItems);
    console.log(`✅ Đã tạo ${menuItems.length} món ăn`);

    console.log('🎉 Quá trình seed dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedData();
