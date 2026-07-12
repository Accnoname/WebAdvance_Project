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
    console.log('CONNECTED TO DATABASE FOR TESTING');

    // Clean up any old test voucher/orders
    await Voucher.deleteMany({ code: { $in: ['TESTPERCENT', 'TESTFIXED', 'TESTEXPIRED', 'TESTUNAVAILABLE', 'TESTMAX'] } });
    await Order.deleteMany({ note: 'TEST_ORDER_NOTE' });
    await Table.deleteMany({ tableNumber: 999 });

    // Create test user and table
    const testUser = await User.findOne({ role: 'quan_ly' });
    if (!testUser) {
      console.error('Run npm run seed first to create users!');
      process.exit(1);
    }

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

    const vPercent = await Voucher.create({
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

    const vFixed = await Voucher.create({
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

    const vExpired = await Voucher.create({
      code: 'TESTEXPIRED',
      discountType: 'fixed',
      discountValue: 20000,
      minOrderAmount: 0,
      maxUses: 2,
      usedCount: 0,
      expiryDate: yesterday,
      isAvailable: true,
      description: 'Đã hết hạn'
    });

    const vUnavailable = await Voucher.create({
      code: 'TESTUNAVAILABLE',
      discountType: 'fixed',
      discountValue: 20000,
      minOrderAmount: 0,
      maxUses: 2,
      usedCount: 0,
      expiryDate: tomorrow,
      isAvailable: false,
      description: 'Không khả dụng'
    });

    const vMax = await Voucher.create({
      code: 'TESTMAX',
      discountType: 'fixed',
      discountValue: 20000,
      minOrderAmount: 0,
      maxUses: 1,
      usedCount: 1,
      expiryDate: tomorrow,
      isAvailable: true,
      description: 'Hết lượt sử dụng'
    });

    console.log('--- 1. Testing validateVoucher ---');

    // Valid check
    const check1 = await VoucherService.validateVoucher('TESTPERCENT', 150000);
    console.log('Valid percentage check:', check1.discountAmount === 15000 && check1.finalAmount === 135000 ? 'PASS' : 'FAIL');

    const check2 = await VoucherService.validateVoucher('TESTFIXED', 100000);
    console.log('Valid fixed check:', check2.discountAmount === 30000 && check2.finalAmount === 70000 ? 'PASS' : 'FAIL');

    // Non-existent
    try {
      await VoucherService.validateVoucher('NOCODE', 100000);
      console.log('Non-existent code: FAIL');
    } catch (err) {
      console.log('Non-existent code:', err.statusCode === 404 ? 'PASS' : 'FAIL');
    }

    // Expired
    try {
      await VoucherService.validateVoucher('TESTEXPIRED', 100000);
      console.log('Expired: FAIL');
    } catch (err) {
      console.log('Expired:', err.statusCode === 400 && err.message.includes('hết hạn') ? 'PASS' : 'FAIL');
    }

    // Unavailable
    try {
      await VoucherService.validateVoucher('TESTUNAVAILABLE', 100000);
      console.log('Unavailable: FAIL');
    } catch (err) {
      console.log('Unavailable:', err.statusCode === 400 && err.message.includes('khả dụng') ? 'PASS' : 'FAIL');
    }

    // Max uses
    try {
      await VoucherService.validateVoucher('TESTMAX', 100000);
      console.log('Max uses: FAIL');
    } catch (err) {
      console.log('Max uses:', err.statusCode === 400 && err.message.includes('lượt sử dụng') ? 'PASS' : 'FAIL');
    }

    // Min order amount
    try {
      await VoucherService.validateVoucher('TESTPERCENT', 80000);
      console.log('Min order amount check: FAIL');
    } catch (err) {
      console.log('Min order amount check:', err.statusCode === 400 && err.message.includes('tối thiểu') ? 'PASS' : 'FAIL');
    }

    console.log('--- 2. Testing Order Service Integration ---');

    // Create Order with Voucher
    const orderData = {
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [
        { menuItemId: testMenuItem._id, quantity: 3 } // 3 * 50k = 150k
      ],
      voucherCode: 'TESTPERCENT',
      note: 'TEST_ORDER_NOTE'
    };

    const order = await OrderService.create(orderData, testUser);
    console.log('Order creation with voucher finalAmount check:', order.finalAmount === 135000 && order.discountAmount === 15000 ? 'PASS' : 'FAIL');

    // Add Items to Order
    const newItems = [
      { menuItemId: testMenuItem._id, quantity: 1 } // + 50k = 200k subtotal
    ];
    const orderWithMoreItems = await OrderService.addItems(order._id, newItems);
    console.log('Add items to order voucher recalculation check:', orderWithMoreItems.totalAmount === 200000 && orderWithMoreItems.discountAmount === 20000 && orderWithMoreItems.finalAmount === 180000 ? 'PASS' : 'FAIL');

    // Cancel Item in Order (updateItemStatus to 'huy')
    const itemToHuy = orderWithMoreItems.items[0]; // Cancel 1 item (3 quantities -> wait, itemId targets the orderItem, which has quantity 3)
    // Actually the updateItemStatus cancels the entire item record (3 quantities * 50k = 150k)
    // Subtotal goes from 200k to 50k (which is below the minOrderAmount of TESTPERCENT)
    const orderAfterCancel = await OrderService.updateItemStatus(order._id, itemToHuy._id, 'huy');
    console.log('Cancel item check: totalAmount =', orderAfterCancel.totalAmount);
    console.log('Cancel item check: finalAmount =', orderAfterCancel.finalAmount);
    console.log('Cancel item check: voucherCode =', orderAfterCancel.voucherCode);
    console.log('Cancel item check (voucher removed since subtotal < 100k):', orderAfterCancel.voucherCode === null && orderAfterCancel.discountAmount === 0 && orderAfterCancel.finalAmount === 50000 ? 'PASS' : 'FAIL');

    console.log('--- 3. Testing Payment Service Integration ---');
    // Reset table status to 'trong' first
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });
    const dbTable = await Table.findById(testTable._id);
    console.log('Database Table Status after reset:', dbTable.status);

    // Create new order to test payment
    const paymentOrderData = {
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [
        { menuItemId: testMenuItem._id, quantity: 2 } // 100k
      ],
      voucherCode: 'TESTFIXED', // 100k - 30k = 70k finalAmount
      note: 'TEST_ORDER_NOTE'
    };
    const paymentOrder = await OrderService.create(paymentOrderData, testUser);

    const voucherBefore = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('Voucher usedCount before payment:', voucherBefore.usedCount);

    const payment = await PaymentService.createOfflinePayment({
      orderId: paymentOrder._id,
      method: 'tien_mat',
      processedBy: testUser._id
    });

    console.log('Payment amount check (should be finalAmount):', payment.amount === 70000 ? 'PASS' : 'FAIL');

    const voucherAfter = await Voucher.findOne({ code: 'TESTFIXED' });
    console.log('Voucher usedCount after payment:', voucherAfter.usedCount);
    console.log('Voucher usedCount increment check:', voucherAfter.usedCount === voucherBefore.usedCount + 1 ? 'PASS' : 'FAIL');

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['TESTPERCENT', 'TESTFIXED', 'TESTEXPIRED', 'TESTUNAVAILABLE', 'TESTMAX'] } });
    await Order.deleteMany({ note: 'TEST_ORDER_NOTE' });
    await Table.deleteMany({ tableNumber: 999 });
    await MenuItem.deleteOne({ _id: testMenuItem._id });

    console.log('\nALL TESTS COMPLETED!');
    process.exit(0);
  } catch (error) {
    console.error('TEST ERROR:', error);
    process.exit(1);
  }
};

runTests();
