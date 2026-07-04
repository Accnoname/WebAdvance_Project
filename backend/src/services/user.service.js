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

  const newUser = await UserRepository.create({
    ...data,
    password: hashedPassword,
    role: data.role || 'nhan_vien'
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

  const updatedUser = await UserRepository.updateById(id, data);
  if (!updatedUser) throw new AppError('Không tìm thấy nhân viên', 404);
  
  const userObject = updatedUser.toObject();
  delete userObject.password;
  return userObject;
};

const deleteStaff = async (id) => {
  const deleted = await UserRepository.deleteById(id);
  if (!deleted) throw new AppError('Không tìm thấy nhân viên', 404);
  return deleted;
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
