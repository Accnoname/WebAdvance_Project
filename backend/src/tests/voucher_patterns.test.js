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
const socketConfig = require('../config/socket');
const http = require('http');

socketConfig.initSocket(http.createServer());

const runTests = async () => {
  let hasErrors = false;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CONNECTED TO DATABASE FOR PATTERNS TESTING');

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['PAT_LIMIT', 'PAT_ROBUST', 'PAT_CANCEL'] } });
    await Order.deleteMany({ note: { $in: ['PAT_ORDER', 'PAT_UNPAID', 'PAT_TEMP', 'PAT_CANCEL_ORDER'] } });
    await Table.deleteMany({ tableNumber: 8888 });

    const testUser = await User.findOne({ role: 'quan_ly' });
    if (!testUser) {
      console.error('Run npm run seed first to populate users!');
      process.exit(1);
    }

    const testTable = await Table.create({
      tableNumber: 8888,
      capacity: 4,
      status: 'trong',
      area: 'main'
    });

    const testMenuItem = await MenuItem.create({
      name: 'Món ăn Test Patterns',
      price: 50000,
      category: 'chinh',
      isAvailable: true
    });

    console.log('\n--- 1. Testing Atomic Reservation & Limit Enforcement ---');
    // Create a voucher with maxUses = 1
    const voucher = await Voucher.create({
      code: 'PAT_LIMIT',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 50000,
      maxUses: 1,
      usedCount: 0,
      expiryDate: new Date(Date.now() + 86400000), // tomorrow
      isAvailable: true,
      description: 'Test atomic reservation and limits'
    });

    // Create first order using PAT_LIMIT
    const order1 = await OrderService.create({
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [{ menuItemId: testMenuItem._id, quantity: 1 }],
      voucherCode: 'PAT_LIMIT',
      note: 'PAT_ORDER'
    }, testUser);

    console.log('First order created successfully:', order1.finalAmount === 40000 ? 'PASS' : 'FAIL');
    if (order1.finalAmount !== 40000) hasErrors = true;

    const voucherAfterFirst = await Voucher.findOne({ code: 'PAT_LIMIT' });
    console.log('usedCount after first order (should be 1):', voucherAfterFirst.usedCount === 1 ? 'PASS' : 'FAIL');
    if (voucherAfterFirst.usedCount !== 1) hasErrors = true;

    // Update the first order's status to 'dang_xu_ly' so that it is not considered an "abandoned unpaid order" in subsequent tests
    order1.orderStatus = 'dang_xu_ly';
    await order1.save();

    // Reset table status to 'trong' to avoid Table dang_phuc_vu block
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });

    // Try creating a second order using PAT_LIMIT (should fail because maxUses is 1 and usedCount is 1)
    try {
      await OrderService.create({
        orderType: 'tai_ban',
        tableId: testTable._id,
        items: [{ menuItemId: testMenuItem._id, quantity: 1 }],
        voucherCode: 'PAT_LIMIT',
        note: 'PAT_ORDER'
      }, testUser);
      console.log('Second order creation: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('Second order creation failed as expected:', 
        err.statusCode === 400 && err.message.includes('lượt sử dụng') ? 'PASS' : 'FAIL', `(${err.message})`);
      if (err.statusCode !== 400 || !err.message.includes('lượt sử dụng')) hasErrors = true;
    }

    console.log('\n--- 2. Testing Rollback on Save Failure ---');
    // Create another voucher with maxUses = 1
    const voucherRobust = await Voucher.create({
      code: 'PAT_ROBUST',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 50000,
      maxUses: 1,
      usedCount: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isAvailable: true
    });

    // Try creating an order with a non-existent table to trigger validation failure in order.save() or table checks
    // We pass tableId of a non-existent ID, but that triggers error BEFORE reservation
    // To trigger error AFTER reservation, we can pass valid parameters but let something fail.
    // Wait, let's see. Inside try block in OrderService.create, it does:
    // 1. Unpaid hold prevention (updates prior orders)
    // 2. validateAndCalculateVoucher
    // 3. Voucher.findOneAndUpdate (reserves voucher)
    // 4. new Order(...)
    // 5. order.save() -> What if order.save() fails? e.g. due to validation error?
    // We can pass an invalid orderType or missing required fields in order validation.
    // E.g. orderType: 'invalid_type' (which violates Order schema enum: ['tai_ban', 'mang_ve', 'giao_hang'])
    // Let's check: yes, orderType validation will fail during order.save()!
    try {
      await OrderService.create({
        orderType: 'invalid_type_to_fail_save',
        tableId: testTable._id,
        items: [{ menuItemId: testMenuItem._id, quantity: 1 }],
        voucherCode: 'PAT_ROBUST',
        note: 'PAT_TEMP'
      }, testUser);
      console.log('Order creation with invalid orderType: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('Order creation failed as expected during save:', err.name === 'ValidationError' ? 'PASS' : 'FAIL', `(${err.message})`);
      if (err.name !== 'ValidationError') {
        console.error('Unexpected error:', err);
        hasErrors = true;
      }
      const vRollback = await Voucher.findOne({ code: 'PAT_ROBUST' });
      console.log('Voucher usedCount after failed creation rollback (should be 0):', vRollback.usedCount === 0 ? 'PASS' : 'FAIL');
      if (vRollback.usedCount !== 0) hasErrors = true;
    }

    console.log('\n--- 3. Testing Rollback on Cancel ---');
    // Create a voucher for cancel rollback
    await Voucher.create({
      code: 'PAT_CANCEL',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 50000,
      maxUses: 5,
      usedCount: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isAvailable: true
    });

    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });
    const orderToCancel = await OrderService.create({
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [{ menuItemId: testMenuItem._id, quantity: 1 }],
      voucherCode: 'PAT_CANCEL',
      note: 'PAT_CANCEL_ORDER'
    }, testUser);

    const vCancelBefore = await Voucher.findOne({ code: 'PAT_CANCEL' });
    console.log('Voucher usedCount before cancel (should be 1):', vCancelBefore.usedCount === 1 ? 'PASS' : 'FAIL');
    if (vCancelBefore.usedCount !== 1) hasErrors = true;

    // Cancel the order
    await OrderService.updateStatus(orderToCancel._id, 'da_huy');
    const vCancelAfter = await Voucher.findOne({ code: 'PAT_CANCEL' });
    console.log('Voucher usedCount after order cancelled (should be 0):', vCancelAfter.usedCount === 0 ? 'PASS' : 'FAIL');
    if (vCancelAfter.usedCount !== 0) hasErrors = true;

    console.log('\n--- 4. Testing Prevent Locked/Abandoned Voucher Holds ---');
    // Create a fresh voucher for this scenario
    const voucherPrevent = await Voucher.create({
      code: 'PAT_PREVENT',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 50000,
      maxUses: 1,
      usedCount: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isAvailable: true
    });

    // Create an unpaid order (status 'moi', isPaid: false) using PAT_PREVENT
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });
    const unpaidOrder = await OrderService.create({
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [{ menuItemId: testMenuItem._id, quantity: 1 }],
      voucherCode: 'PAT_PREVENT',
      note: 'PAT_UNPAID'
    }, testUser);

    const vBeforeNewOrder = await Voucher.findOne({ code: 'PAT_PREVENT' });
    console.log('Voucher usedCount with unpaid order (should be 1):', vBeforeNewOrder.usedCount === 1 ? 'PASS' : 'FAIL');
    if (vBeforeNewOrder.usedCount !== 1) hasErrors = true;

    // Create a new order using the same table and voucher
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });
    const newOrder = await OrderService.create({
      orderType: 'tai_ban',
      tableId: testTable._id,
      items: [{ menuItemId: testMenuItem._id, quantity: 1 }],
      voucherCode: 'PAT_PREVENT',
      note: 'PAT_ORDER'
    }, testUser);

    console.log('New order created successfully:', newOrder.finalAmount === 40000 ? 'PASS' : 'FAIL');
    if (newOrder.finalAmount !== 40000) hasErrors = true;

    const priorOrderAfter = await Order.findById(unpaidOrder._id);
    console.log('Prior unpaid order status (should be da_huy):', priorOrderAfter.orderStatus === 'da_huy' ? 'PASS' : 'FAIL');
    if (priorOrderAfter.orderStatus !== 'da_huy') hasErrors = true;

    const vFinal = await Voucher.findOne({ code: 'PAT_PREVENT' });
    console.log('Voucher usedCount after new order and prior order cancellation (should be 1):', vFinal.usedCount === 1 ? 'PASS' : 'FAIL');
    if (vFinal.usedCount !== 1) hasErrors = true;

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['PAT_LIMIT', 'PAT_ROBUST', 'PAT_CANCEL', 'PAT_PREVENT'] } });
    await Order.deleteMany({ note: { $in: ['PAT_ORDER', 'PAT_UNPAID', 'PAT_TEMP', 'PAT_CANCEL_ORDER'] } });
    await Table.deleteMany({ tableNumber: 8888 });
    await MenuItem.deleteOne({ _id: testMenuItem._id });

    console.log('\n--- Patterns Test suite summary ---');
    if (hasErrors) {
      console.log('Status: FAILED');
      process.exit(1);
    } else {
      console.log('Status: SUCCESS');
      process.exit(0);
    }
  } catch (err) {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  }
};

runTests();
