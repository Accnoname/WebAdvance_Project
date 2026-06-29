const MenuItemRepository = require('../repositories/menuItem.repository');
const { AppError } = require('../middlewares/error.middleware');
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
  const total = await MenuItemRepository.count(filter);

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
  const menuItemData = { ...data };
  if (file) {
    menuItemData.image = `/uploads/menu/${file.filename}`;
  }
  return await MenuItemRepository.create(menuItemData);
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

  return await MenuItemRepository.updateById(id, updateData);
};

const remove = async (id) => {
  const item = await getById(id);
  
  if (item.image) {
    const imgPath = path.join(__dirname, '../../', item.image);
    fs.unlink(imgPath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('Lỗi xóa ảnh:', err);
    });
  }

  await MenuItemRepository.deleteById(id);
  return item;
};

const toggleAvailability = async (id) => {
  try {
    return await MenuItemRepository.toggleAvailability(id);
  } catch (error) {
    throw new AppError(error.message, 404);
  }
};

module.exports = { getAll, getById, create, update, remove, toggleAvailability };
