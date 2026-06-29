// Base Repository — chứa các hàm CRUD dùng chung
const createBaseRepository = (Model) => ({
  findAll: (filter = {}, options = {}, callback) => {
    Model.find(filter)
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .then(docs => callback(null, docs))
      .catch(err => callback(err));
  },

  findById: (id, callback) => {
    Model.findById(id)
      .then(doc => {
        if (!doc) return callback(new Error('Không tìm thấy tài liệu'));
        callback(null, doc);
      })
      .catch(err => callback(err));
  },

  create: async (data) => Model.create(data),

  updateById: async (id, data) =>
    Model.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: async (id) => Model.findByIdAndDelete(id),

  count: async (filter = {}) => Model.countDocuments(filter)
});

module.exports = { createBaseRepository };
