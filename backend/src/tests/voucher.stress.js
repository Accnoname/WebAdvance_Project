const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Voucher = require('../models/Voucher.model');
const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const User = require('../models/User.model');
const VoucherService = require('../services/voucher.service');
const OrderService = require('../services/order.service');
const PaymentService = require('../services/payment.service');
const socketConfig = require('../config/socket');
const http = require('http');
socketConfig.initSocket(http.createServer());

const runStressTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CONNECTED TO DATABASE FOR STRESS TESTING');

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['STRESSTEST1', 'STRESSTEST2'] } });
    await Order.deleteMany({ note: 'STRESS_TEST_ORDER_NOTE' });
    await Table.deleteMany({ tableNumber: 9999 });

    // Create test user and table
    const testUser = await User.findOne({ role: 'quan_ly' });
    if (!testUser) {
      console.error('Run npm run seed first!');
      process.exit(1);
    }

    const testTable = await Table.create({
      tableNumber: 9999,
      capacity: 4,
      status: 'trong',
      area: 'main'
    });

    const testMenuItem = await MenuItem.create({
      name: 'Món ăn Stress Voucher',
      price: 20000,
      category: 'chinh',
      isAvailable: true
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Stress check: Fixed discount greater than order amount (100k discount on 20k order)
    const vFixedOver = await Voucher.create({
      code: 'STRESSTEST1',
      discountType: 'fixed',
      discountValue: 100000,
      minOrderAmount: 0,
      maxUses: 10,
      usedCount: 0,
      expiryDate: tomorrow,
      isAvailable: true,
      description: 'Giảm 100k cho đơn từ 0đ'
    });

    console.log('--- 1. Testing fixed discount larger than subtotal ---');
    const result1 = await VoucherService.validateVoucher('STRESSTEST1', 20000);
    console.log('Validate result (discountAmount = 20000, finalAmount = 0):',
      result1.discountAmount === 20000 && result1.finalAmount === 0 ? 'PASS' : 'FAIL');

    // Create order with this voucher
    const order1 = await OrderService.create({
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [{ menuItemId: testMenuItem._id, quantity: 1 }], // 20k
      voucherCode: 'STRESSTEST1',
      note: 'STRESS_TEST_ORDER_NOTE'
    }, testUser);

    console.log('Order created: totalAmount =', order1.totalAmount, ', discountAmount =', order1.discountAmount, ', finalAmount =', order1.finalAmount);
    console.log('Order with discount larger than subtotal check:',
      order1.discountAmount === 20000 && order1.finalAmount === 0 ? 'PASS' : 'FAIL');

    // 2. Testing 0 amount order validation
    console.log('--- 2. Testing voucher validation on 0 subtotal order ---');
    try {
      await VoucherService.validateVoucher('STRESSTEST1', 0);
      console.log('Validate 0 subtotal: PASS');
    } catch (err) {
      console.log('Validate 0 subtotal (unexpected error):', err.message);
    }

    // 3. Testing percentage discount capping (120% percentage discount, if created)
    console.log('--- 3. Testing percentage discount greater than 100% (capping) ---');
    const vPercentOver = await Voucher.create({
      code: 'STRESSTEST2',
      discountType: 'percentage',
      discountValue: 120, // 120%
      minOrderAmount: 0,
      maxUses: 10,
      usedCount: 0,
      expiryDate: tomorrow,
      isAvailable: true,
      description: 'Giảm 120% cho đơn từ 0đ'
    });

    const result2 = await VoucherService.validateVoucher('STRESSTEST2', 50000);
    console.log('Validate result (discountAmount = 50000, finalAmount = 0):',
      result2.discountAmount === 50000 && result2.finalAmount === 0 ? 'PASS' : 'FAIL');

    // Reset table status to allow second order
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });

    const order2 = await OrderService.create({
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [{ menuItemId: testMenuItem._id, quantity: 2 }], // 40k
      voucherCode: 'STRESSTEST2',
      note: 'STRESS_TEST_ORDER_NOTE'
    }, testUser);

    console.log('Order created with 120% voucher: totalAmount =', order2.totalAmount, ', discountAmount =', order2.discountAmount, ', finalAmount =', order2.finalAmount);
    console.log('Order 120% discount check:',
      order2.discountAmount === 40000 && order2.finalAmount === 0 ? 'PASS' : 'FAIL');

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['STRESSTEST1', 'STRESSTEST2'] } });
    await Order.deleteMany({ note: 'STRESS_TEST_ORDER_NOTE' });
    await Table.deleteMany({ tableNumber: 9999 });
    await MenuItem.deleteOne({ _id: testMenuItem._id });

    console.log('\nSTRESS TESTS COMPLETED!');
    process.exit(0);
  } catch (error) {
    console.error('STRESS TEST ERROR:', error);
    process.exit(1);
  }
};

runStressTests();
