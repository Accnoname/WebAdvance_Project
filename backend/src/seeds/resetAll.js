const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const Order = require('../models/Order.model');
const Payment = require('../models/Payment.model');
const Reservation = require('../models/Reservation.model');
const Voucher = require('../models/Voucher.model');
const QRCode = require('qrcode');

const resetAllData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // 1. Xóa TOÀN BỘ dữ liệu cũ kể cả đơn hàng, giao dịch, lịch đặt bàn
    await User.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Reservation.deleteMany({});
    await Voucher.deleteMany({});
    console.log('🧹 Đã xóa SẠCH SẼ toàn bộ dữ liệu cũ (Users, Tables, MenuItems, Orders, Payments, Reservations, Vouchers)');

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
        name:     'Nhân Viên Phục Vụ',
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
        status: 'trong', // Reset toàn bộ về trạng thái trống
        area: getArea(i),
        qrCode
      });
    }
    await Table.insertMany(tables);
    console.log(`✅ Đã tạo ${tables.length} bàn ăn (tất cả đều đang trống)`);

    // 4. Tạo dữ liệu Món ăn
    const menuItems = require('./menuData');
    await MenuItem.insertMany(menuItems);
    console.log(`✅ Đã tạo ${menuItems.length} món ăn`);

    console.log('🎉 Quá trình Factory Reset dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi reset dữ liệu:', error);
    process.exit(1);
  }
};

resetAllData();
