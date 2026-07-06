const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const UserService = require('../services/user.service');

const runTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('CONNECTED TO DATABASE FOR TESTING');

    // Dọn dẹp dữ liệu test cũ
    await User.deleteMany({ email: { $in: ['test_admin@gmail.com', 'test_staff_1@gmail.com', 'test_staff_2@gmail.com', 'test_customer@gmail.com'] } });

    // Tạo các tài khoản test
    const adminUser = await User.create({
      name: 'Test Master Admin',
      email: 'admin@gmail.com', // Trùng email admin tối cao để test logic chặn xóa
      password: 'testpassword123',
      role: 'quan_ly'
    }).catch(err => {
      // Nếu đã có admin@gmail.com từ seed trước đó thì tìm lại
      return User.findOne({ email: 'admin@gmail.com' });
    });

    const staff1 = await User.create({
      name: 'Test Staff 1',
      email: 'test_staff_1@gmail.com',
      password: 'testpassword123',
      role: 'nhan_vien',
      phone: '0900000001'
    });

    const staff2 = await User.create({
      name: 'Test Staff 2',
      email: 'test_staff_2@gmail.com',
      password: 'testpassword123',
      role: 'nhan_vien',
      phone: '0900000002'
    });

    const customer = await User.create({
      name: 'Test Customer',
      email: 'test_customer@gmail.com',
      password: 'testpassword123',
      role: 'khach_hang',
      phone: '0900000003'
    });

    console.log('--- 1. Testing getAllUsers filters & search ---');
    
    // Test lấy tất cả
    const allUsers = await UserService.getAllUsers({});
    const emails = allUsers.map(u => u.email);
    if (emails.includes('admin@gmail.com') && emails.includes('test_staff_1@gmail.com') && emails.includes('test_customer@gmail.com')) {
      console.log('Get all users check: PASS');
    } else {
      console.error('Get all users check: FAIL');
    }

    // Test filter theo role
    const staffUsers = await UserService.getAllUsers({ role: 'nhan_vien' });
    const allAreStaff = staffUsers.every(u => u.role === 'nhan_vien');
    if (allAreStaff && staffUsers.length >= 2) {
      console.log('Filter by role check: PASS');
    } else {
      console.error('Filter by role check: FAIL');
    }

    // Test search theo name
    const searchByName = await UserService.getAllUsers({ search: 'Staff 1' });
    if (searchByName.length === 1 && searchByName[0].email === 'test_staff_1@gmail.com') {
      console.log('Search by name check: PASS');
    } else {
      console.error('Search by name check: FAIL');
    }

    // Test search theo phone
    const searchByPhone = await UserService.getAllUsers({ search: '0900000003' });
    if (searchByPhone.length === 1 && searchByPhone[0].email === 'test_customer@gmail.com') {
      console.log('Search by phone check: PASS');
    } else {
      console.error('Search by phone check: FAIL');
    }

    console.log('--- 2. Testing deleteStaff security logic ---');

    // Case 1: Chặn tự xóa chính mình
    try {
      await UserService.deleteStaff(staff1._id, staff1._id);
      console.error('Self-deletion check: FAIL (allowed self deletion)');
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Bạn không thể tự xóa chính mình') {
        console.log('Self-deletion check: PASS');
      } else {
        console.error('Self-deletion check: FAIL', err.message);
      }
    }

    // Case 2: Chặn xóa Admin tối cao
    try {
      await UserService.deleteStaff(adminUser._id, staff1._id);
      console.error('Master admin deletion check: FAIL (allowed admin deletion)');
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Không thể xóa tài khoản Quản trị tối cao') {
        console.log('Master admin deletion check: PASS');
      } else {
        console.error('Master admin deletion check: FAIL', err.message);
      }
    }

    // Case 3: Xóa tài khoản bình thường thành công
    try {
      await UserService.deleteStaff(staff2._id, staff1._id);
      const searchDeleted = await User.findById(staff2._id);
      if (!searchDeleted) {
        console.log('Normal deletion check: PASS');
      } else {
        console.error('Normal deletion check: FAIL (record still exists)');
      }
    } catch (err) {
      console.error('Normal deletion check: FAIL', err.message);
    }

    // Dọn dẹp dữ liệu test
    await User.deleteMany({ email: { $in: ['test_staff_1@gmail.com', 'test_staff_2@gmail.com', 'test_customer@gmail.com'] } });
    
    console.log('\nALL USER TESTS COMPLETED!');
    process.exit(0);
  } catch (error) {
    console.error('TEST ERROR:', error);
    process.exit(1);
  }
};

runTests();
