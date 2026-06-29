// Base Repository — chứa các hàm CRUD dùng chung
const createBaseRepository = (Model) => ({
  findAll: (filter = {}, options = {}, callback) => {
    Model.find(filter)
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .exec(callback);
  },

  findById: (id, callback) => {
    Model.findById(id).exec((err, doc) => {
      if (err) return callback(err);
      if (!doc) return callback(new Error('Không tìm thấy tài liệu'));
      callback(null, doc);
    });
  },

  create: async (data) => Model.create(data),

  updateById: async (id, data) =>
    Model.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: async (id) => Model.findByIdAndDelete(id),

  count: async (filter = {}) => Model.countDocuments(filter)
});

module.exports = { createBaseRepository };
