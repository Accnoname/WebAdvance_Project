const MenuItemRepository = require('../repositories/menuItem.repository');
const MenuItem = require('../models/MenuItem.model');
const { AppError } = require('../middlewares/error.middleware');
const Order = require('../models/Order.model');
const fs = require('fs');
const path = require('path');

const getAll = async (query) => {
  const filter = {};
  if (query.category) {
    filter.category = query.category;
  }
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }
  if (query.isAvailable) {
    filter.isAvailable = query.isAvailable === 'true';
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 12;
  const skip = (page - 1) * limit;

  // We need to count total for pagination
  const total = await new Promise((resolve, reject) => {
    MenuItemRepository.count(filter, (err, count) => {
      if (err) return reject(err);
      resolve(count);
    });
  });

  const data = await new Promise((resolve, reject) => {
    MenuItemRepository.findAll(filter, { skip, limit }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });

  return { data, total, page, limit };
};

const getById = async (id) => {
  const item = await new Promise((resolve, reject) => {
    MenuItemRepository.findById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
  if (!item) throw new AppError('Không tìm thấy món', 404);
  return item;
};

const create = async (data, file) => {
  const existing = await MenuItem.findOne({ name: data.name });
  if (existing) {
    throw new AppError('Tên món đã tồn tại', 409);
  }

  const menuItemData = { ...data };
  if (file) {
    menuItemData.image = `/uploads/menu/${file.filename}`;
  }
  return await new Promise((resolve, reject) => {
    MenuItemRepository.create(menuItemData, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
};

const update = async (id, data, file) => {
  const item = await getById(id);
  
  const updateData = { ...data };
  if (file) {
    // Delete old image if it exists
    if (item.image) {
      const oldPath = path.join(__dirname, '../../', item.image);
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Lỗi xóa ảnh cũ:', err);
      });
    }
    updateData.image = `/uploads/menu/${file.filename}`;
  }

  return await new Promise((resolve, reject) => {
    MenuItemRepository.updateById(id, updateData, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
};

const remove = async (id) => {
  const item = await getById(id);

  // [M6] Không xoá món đang trong đơn hàng chưa hoàn thành
  const activeOrderCount = await Order.countDocuments({
    'items.menuItem': item._id,
    orderStatus: { $in: ['moi', 'dang_xu_ly'] }
  });
  if (activeOrderCount > 0) {
    throw new AppError(
      `Món "${item.name}" đang có trong ${activeOrderCount} đơn hàng chưa hoàn thành. Hãy ẩn món (isAvailable=false) thay vì xóa.`,
      400
    );
  }

  if (item.image) {
    const imgPath = path.join(__dirname, '../../', item.image);
    fs.unlink(imgPath, () => {}); // Bỏ qua lỗi xóa file
  }

  await new Promise((resolve, reject) => {
    MenuItemRepository.deleteById(id, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  return item;
};

// [N4] Re-throw đúng lỗi, không ép tất cả thành 404
const toggleAvailability = async (id) => {
  return await MenuItemRepository.toggleAvailability(id);
};

module.exports = { getAll, getById, create, update, remove, toggleAvailability };
