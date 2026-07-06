const UserRepository = require('../repositories/user.repository');
const { AppError } = require('../middlewares/error.middleware');
const bcrypt = require('bcryptjs');

const getAllUsers = async (query = {}) => {
  const filter = {};

  // 1. Phân loại theo vai trò (role)
  if (query.role && query.role !== 'all') {
    filter.role = query.role;
  }

  // 2. Tìm kiếm theo tên, email, sđt
  if (query.search) {
    const searchRegex = { $regex: query.search, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  return await new Promise((resolve, reject) => {
    UserRepository.findAll(filter, { limit: 100 }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
};

const createStaff = async (data) => {
  const existingUser = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(data.email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (existingUser) {
    throw new AppError('Email đã được sử dụng', 409);
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const newUser = await new Promise((resolve, reject) => {
    UserRepository.create({
      ...data,
      password: hashedPassword,
      role: data.role || 'nhan_vien'
    }, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  const userObject = newUser.toObject();
  delete userObject.password;
  return userObject;
};

const updateStaff = async (id, data) => {
  if (data.password) {
    const salt = await bcrypt.genSalt(12);
    data.password = await bcrypt.hash(data.password, salt);
  }

  const updatedUser = await new Promise((resolve, reject) => {
    UserRepository.updateById(id, data, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
  if (!updatedUser) throw new AppError('Không tìm thấy người dùng', 404);

  const userObject = updatedUser.toObject();
  delete userObject.password;
  return userObject;
};

const deleteStaff = async (id, currentUserId) => {
  // Chặn tự xóa bản thân
  if (currentUserId && id.toString() === currentUserId.toString()) {
    throw new AppError('Bạn không thể tự xóa chính mình', 400);
  }

  // Tìm người dùng trước để kiểm tra quyền hạn/email
  const user = await new Promise((resolve, reject) => {
    UserRepository.findById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  // Chặn xóa Admin tối cao
  if (user.email === 'admin@gmail.com') {
    throw new AppError('Không thể xóa tài khoản Quản trị tối cao', 400);
  }

  const deleted = await new Promise((resolve, reject) => {
    UserRepository.deleteById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
  if (!deleted) throw new AppError('Không tìm thấy người dùng', 404);
  return deleted;
};

module.exports = { getAllUsers, createStaff, updateStaff, deleteStaff };
