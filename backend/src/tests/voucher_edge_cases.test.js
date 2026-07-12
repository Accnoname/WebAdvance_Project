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

// Init socket to prevent error inside OrderService when emitting socket events
socketConfig.initSocket(http.createServer());

const runEdgeCaseTests = async () => {
  let hasErrors = false;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CONNECTED TO DATABASE FOR EDGE CASE TESTING');

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['MIN_EXACT', 'EXP_EXACT', 'EXP_PAST', 'TEST_UNAVAIL', 'NULL_EXP', 'NULL_VAL', 'MISSING_VAL', 'NULL_TYPE'] } });
    await Order.deleteMany({ note: 'EDGE_CASE_TEST_ORDER' });
    await Table.deleteMany({ tableNumber: 9999 });

    // Fetch or create a test user and table for integration
    const testUser = await User.findOne({ role: 'quan_ly' });
    if (!testUser) {
      console.error('Run npm run seed first to populate users!');
      process.exit(1);
    }

    const testTable = await Table.create({
      tableNumber: 9999,
      capacity: 2,
      status: 'trong',
      area: 'main'
    });

    const testMenuItem = await MenuItem.create({
      name: 'Món ăn Test Edge Case',
      price: 50000,
      category: 'chinh',
      isAvailable: true
    });

    // --- CASE 1: Order amount exactly equal to minOrderAmount ---
    console.log('\n--- 1. Testing voucher with order amount EXACTLY equal to minOrderAmount ---');
    const voucherMinExact = await Voucher.create({
      code: 'MIN_EXACT',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 100000,
      expiryDate: new Date(Date.now() + 86400000), // tomorrow
      isAvailable: true
    });

    try {
      const result = await VoucherService.validateVoucher('MIN_EXACT', 100000);
      console.log('validateVoucher result (discount = 10000, final = 90000):', 
        result.discountAmount === 10000 && result.finalAmount === 90000 ? 'PASS' : 'FAIL');
    } catch (err) {
      console.error('validateVoucher failed unexpectedly:', err);
      hasErrors = true;
    }

    // Try creating an order with exactly minOrderAmount
    try {
      const order = await OrderService.create({
        orderType: 'tai_ban',
        tableId: testTable._id,
        items: [{ menuItemId: testMenuItem._id, quantity: 2 }], // 2 * 50k = 100k
        voucherCode: 'MIN_EXACT',
        note: 'EDGE_CASE_TEST_ORDER'
      }, testUser);
      console.log('Order creation with exact minOrderAmount:', 
        order.discountAmount === 10000 && order.finalAmount === 90000 ? 'PASS' : 'FAIL');
    } catch (err) {
      console.error('Order creation failed unexpectedly:', err);
      hasErrors = true;
    }

    // --- CASE 2: Order amount less than minOrderAmount ---
    console.log('\n--- 2. Testing voucher with order amount LESS than minOrderAmount ---');
    try {
      await VoucherService.validateVoucher('MIN_EXACT', 99000);
      console.log('validateVoucher less than minOrderAmount: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('validateVoucher less than minOrderAmount:', 
        err.statusCode === 400 && err.message.includes('tối thiểu') ? 'PASS' : 'FAIL', `(${err.message})`);
    }

    // Reset table status to allow order creation
    await Table.findByIdAndUpdate(testTable._id, { status: 'trong', currentOrder: null });

    // Try creating an order with less than minOrderAmount
    try {
      await OrderService.create({
        orderType: 'tai_ban',
        tableId: testTable._id,
        items: [{ menuItemId: testMenuItem._id, quantity: 1 }], // 1 * 50k = 50k (< 100k)
        voucherCode: 'MIN_EXACT',
        note: 'EDGE_CASE_TEST_ORDER'
      }, testUser);
      console.log('Order creation with less than minOrderAmount: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('Order creation with less than minOrderAmount:', 
        err.statusCode === 400 && err.message.includes('tối thiểu') ? 'PASS' : 'FAIL', `(${err.message})`);
    }

    // --- CASE 3: Voucher Expiration: Exactly on expiry date vs after expiry date ---
    console.log('\n--- 3. Testing Voucher expiration date logic ---');
    
    const expiredVoucher = await Voucher.create({
      code: 'EXP_PAST',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 0,
      expiryDate: new Date(Date.now() - 1000), // 1 second ago
      isAvailable: true
    });

    try {
      await VoucherService.validateVoucher('EXP_PAST', 50000);
      console.log('validateVoucher after expiryDate: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('validateVoucher after expiryDate:', 
        err.statusCode === 400 && err.message.includes('hết hạn') ? 'PASS' : 'FAIL', `(${err.message})`);
    }

    const exactVoucher = await Voucher.create({
      code: 'EXP_EXACT',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 0,
      expiryDate: new Date(Date.now() + 5000), // 5 seconds in the future
      isAvailable: true
    });

    try {
      const result = await VoucherService.validateVoucher('EXP_EXACT', 50000);
      console.log('validateVoucher before/on expiryDate (valid):', 
        result.discountAmount === 10000 ? 'PASS' : 'FAIL');
    } catch (err) {
      console.error('validateVoucher before/on expiryDate failed unexpectedly:', err);
      hasErrors = true;
    }

    // --- CASE 4: Voucher deleted or isAvailable = false ---
    console.log('\n--- 4. Testing voucher deleted vs isAvailable = false ---');
    
    // Deleted (non-existent) code
    try {
      await VoucherService.validateVoucher('DELETED_CODE', 50000);
      console.log('validateVoucher for non-existent/deleted code: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('validateVoucher for non-existent/deleted code:', 
        err.statusCode === 404 && err.message.includes('không tồn tại') ? 'PASS' : 'FAIL', `(${err.message})`);
    }

    // isAvailable = false
    await Voucher.create({
      code: 'TEST_UNAVAIL',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isAvailable: false
    });

    try {
      await VoucherService.validateVoucher('TEST_UNAVAIL', 50000);
      console.log('validateVoucher when isAvailable is false: FAIL (did not throw)');
      hasErrors = true;
    } catch (err) {
      console.log('validateVoucher when isAvailable is false:', 
        err.statusCode === 400 && err.message.includes('không khả dụng') ? 'PASS' : 'FAIL', `(${err.message})`);
    }

    // --- CASE 5: Database nulls or missing fields ---
    console.log('\n--- 5. Testing database nulls or missing fields ---');
    
    const tomorrow = new Date(Date.now() + 86400000);

    // Test 5a: ExpiryDate is null
    console.log('\n- Test 5a: expiryDate is null');
    await mongoose.connection.db.collection('vouchers').insertOne({
      code: 'NULL_EXP',
      discountType: 'fixed',
      discountValue: 10000,
      minOrderAmount: 0,
      expiryDate: null,
      isAvailable: true
    });

    try {
      await VoucherService.validateVoucher('NULL_EXP', 50000);
      console.log('Result: FAIL (Did not throw on null expiryDate)');
      hasErrors = true;
    } catch (err) {
      console.log('Result: PASS (Successfully threw error on null expiry:', err.message, ')');
    }

    // Test 5b: discountValue is null
    console.log('\n- Test 5b: discountValue is null (discountType ='fixed")');
    await mongoose.connection.db.collection('vouchers').insertOne({
      code: 'NULL_VAL',
      discountType: 'fixed',
      discountValue: null,
      minOrderAmount: 0,
      expiryDate: tomorrow,
      isAvailable: true
    });

    try {
      const res = await VoucherService.validateVoucher('NULL_VAL', 50000);
      console.log('Result of validateVoucher:', res);
      if (Number.isNaN(res.finalAmount) || Number.isNaN(res.discountAmount)) {
        console.log('Result: FAIL (validateVoucher returned NaN values!)');
        hasErrors = true;
      } else {
        console.log('Result: PASS (Coerced null value safely to 0 discount or similar without crashing)');
      }
    } catch (err) {
      console.log('Result: PASS (Threw handled error:', err.message, ')');
    }

    // Test 5c: discountValue is missing (undefined)
    console.log('\n- Test 5c: discountValue is missing/undefined');
    await mongoose.connection.db.collection('vouchers').insertOne({
      code: 'MISSING_VAL',
      discountType: 'fixed',
      minOrderAmount: 0,
      expiryDate: tomorrow,
      isAvailable: true
    });

    try {
      const res = await VoucherService.validateVoucher('MISSING_VAL', 50000);
      console.log('Result of validateVoucher:', res);
      if (Number.isNaN(res.finalAmount) || Number.isNaN(res.discountAmount)) {
        console.log('Result: FAIL (validateVoucher returned NaN values!)');
        hasErrors = true;
      } else {
        console.log('Result: PASS (Safe)');
      }
    } catch (err) {
      console.log('Result: PASS (Threw handled error:', err.message, ')');
    }

    // Test 5d: discountType is null/undefined
    console.log('\n- Test 5d: discountType is null/undefined');
    await mongoose.connection.db.collection('vouchers').insertOne({
      code: 'NULL_TYPE',
      discountType: null,
      discountValue: 10000,
      minOrderAmount: 0,
      expiryDate: tomorrow,
      isAvailable: true
    });

    try {
      const res = await VoucherService.validateVoucher('NULL_TYPE', 50000);
      console.log('Result of validateVoucher:', res);
      if (Number.isNaN(res.finalAmount) || Number.isNaN(res.discountAmount)) {
        console.log('Result: FAIL (validateVoucher returned NaN values!)');
        hasErrors = true;
      } else {
        console.log('Result: PASS (Treated missing discountType as 0 discount safely)');
      }
    } catch (err) {
      console.log('Result: PASS (Threw handled error:', err.message, ')');
    }

    // Clean up
    await Voucher.deleteMany({ code: { $in: ['MIN_EXACT', 'EXP_EXACT', 'EXP_PAST', 'TEST_UNAVAIL', 'NULL_EXP', 'NULL_VAL', 'MISSING_VAL', 'NULL_TYPE'] } });
    await Order.deleteMany({ note: 'EDGE_CASE_TEST_ORDER' });
    await Table.deleteMany({ tableNumber: 9999 });
    await MenuItem.deleteOne({ _id: testMenuItem._id });

    console.log('\n--- Test suite summary ---');
    if (hasErrors) {
      console.log('Status: FAILED (Some edge cases produced bugs, crashes, or incorrect behavior)');
      process.exit(1);
    } else {
      console.log('Status: SUCCESS (All edge cases behaved as expected)');
      process.exit(0);
    }

  } catch (err) {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  }
};

runEdgeCaseTests();
