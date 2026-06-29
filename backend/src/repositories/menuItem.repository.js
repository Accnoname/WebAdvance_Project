const MenuItem = require('../models/MenuItem.model');
const { createBaseRepository } = require('./base.repository');

const MenuItemRepository = {
  ...createBaseRepository(MenuItem),

  findByCategory: async (category) =>
    MenuItem.find({ category, isAvailable: true }),

  toggleAvailability: async (id) => {
    const item = await MenuItem.findById(id);
    if (!item) throw new Error('Không tìm thấy món');
    item.isAvailable = !item.isAvailable;
    return item.save();
  }
};

module.exports = MenuItemRepository;
