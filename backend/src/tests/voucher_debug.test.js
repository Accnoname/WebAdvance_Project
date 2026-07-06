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

const runTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CONNECTED TO DATABASE FOR DEBUGGING');

    // Print all existing vouchers before cleanup
    const initialVouchers = await Voucher.find({});
    console.log('Initial Vouchers in DB:', initialVouchers.map(v => v.code));

    // Clean up any old test voucher/orders
    await Voucher.deleteMany({ code: { $in: ['TESTPERCENT', 'TESTFIXED', 'TESTEXPIRED', 'TESTUNAVAILABLE', 'TESTMAX'] } });
    await Order.deleteMany({ note: 'TEST_ORDER_NOTE' });
    await Table.deleteMany({ tableNumber: 999 });

    // Create test user and table
    const testUser = await User.findOne({ role: 'quan_ly' });
    const testTable = await Table.create({
      tableNumber: 999,
      capacity: 4,
      status: 'trong',
      area: 'main'
    });

    const testMenuItem = await MenuItem.create({
      name: 'Món ăn Test Voucher',
      price: 50000,
      category: 'chinh',
      isAvailable: true
    });

    // Create test vouchers
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await Voucher.create({
      code: 'TESTPERCENT',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 100000,
      maxUses: 5,
      usedCount: 0,
      expiryDate: tomorrow,
      isAvailable: true,
      description: 'Giảm 10% cho đơn từ 100k'
    });

    await Voucher.create({
      code: 'TESTFIXED',
      discountType: 'fixed',
      discountValue: 30000,
      minOrderAmount: 80000,
      maxUses: 2,
      usedCount: 0,
      expiryDate: tomorrow,
      isAvailable: true,
      description: 'Giảm 30k cho đơn từ 80k'
    });

    console.log('Created vouchers. Fetching TESTFIXED directly...');
    const foundFixed = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('TESTFIXED directly after creation:', foundFixed ? foundFixed.code : 'NOT FOUND');

    console.log('--- 1. Testing validateVoucher ---');
    const check2 = await VoucherService.validateVoucher('TESTFIXED', 100000);
    console.log('Valid fixed check:', check2.discountAmount === 30000 && check2.finalAmount === 70000 ? 'PASS' : 'FAIL');

    console.log('--- 2. Testing Order Service Integration ---');
    const orderData = {
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [
        { menuItemId: testMenuItem._id, quantity: 3 }
      ],
      voucherCode: 'TESTPERCENT',
      note: 'TEST_ORDER_NOTE'
    };

    const order = await OrderService.create(orderData, testUser);
    console.log('Order created.');

    console.log('Checking TESTFIXED after OrderService.create:');
    const foundFixed2 = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('TESTFIXED after OrderService.create:', foundFixed2 ? foundFixed2.code : 'NOT FOUND');

    // Add Items to Order
    const newItems = [
      { menuItemId: testMenuItem._id, quantity: 1 }
    ];
    const orderWithMoreItems = await OrderService.addItems(order._id, newItems);
    console.log('Added items.');

    console.log('Checking TESTFIXED after OrderService.addItems:');
    const foundFixed3 = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('TESTFIXED after OrderService.addItems:', foundFixed3 ? foundFixed3.code : 'NOT FOUND');

    // Cancel Item in Order
    const itemToHuy = orderWithMoreItems.items[0];
    const orderAfterCancel = await OrderService.updateItemStatus(order._id, itemToHuy._id, 'huy');
    console.log('Cancelled item.');

    console.log('Checking TESTFIXED after OrderService.updateItemStatus:');
    const foundFixed4 = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('TESTFIXED after OrderService.updateItemStatus:', foundFixed4 ? foundFixed4.code : 'NOT FOUND');

    console.log('--- 3. Testing Payment Service Integration ---');
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });

    const paymentOrderData = {
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [
        { menuItemId: testMenuItem._id, quantity: 2 }
      ],
      voucherCode: 'TESTFIXED',
      note: 'TEST_ORDER_NOTE'
    };

    console.log('Creating payment order...');
    const paymentOrder = await OrderService.create(paymentOrderData, testUser);
    console.log('Payment order created.');

    console.log('Checking TESTFIXED after payment order creation:');
    const foundFixed5 = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('TESTFIXED after payment order creation:', foundFixed5 ? foundFixed5.code : 'NOT FOUND');

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['TESTPERCENT', 'TESTFIXED', 'TESTEXPIRED', 'TESTUNAVAILABLE', 'TESTMAX'] } });
    await Order.deleteMany({ note: 'TEST_ORDER_NOTE' });
    await Table.deleteMany({ tableNumber: 999 });
    await MenuItem.deleteOne({ _id: testMenuItem._id });

    console.log('\nDEBUG COMPLETED!');
    process.exit(0);
  } catch (error) {
    console.error('DEBUG ERROR:', error);
    process.exit(1);
  }
};

runTests();
