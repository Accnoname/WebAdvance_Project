const UserRepository = require('../repositories/user.repository');
const { AppError } = require('../middlewares/error.middleware');
const bcrypt = require('bcryptjs');

const getStaff = async () => {
  return await new Promise((resolve, reject) => {
    UserRepository.findAll({ role: { $in: ['nhan_vien', 'quan_ly'] } }, { limit: 100 }, (err, docs) => {
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
  if (!updatedUser) throw new AppError('Không tìm thấy nhân viên', 404);

  const userObject = updatedUser.toObject();
  delete userObject.password;
  return userObject;
};

const deleteStaff = async (id) => {
  const deleted = await new Promise((resolve, reject) => {
    UserRepository.deleteById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
  if (!deleted) throw new AppError('Không tìm thấy nhân viên', 404);
  return deleted;
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
