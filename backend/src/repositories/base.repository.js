// Base Repository — chứa các hàm CRUD dùng chung theo error-first callback
const createBaseRepository = (Model) => ({
  findAll: (filter = {}, options = {}, callback) => {
    Model.find(filter)
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .then(docs => callback(null, docs))
      .catch(err => callback(err));
  },

  // [N1] Trả về null khi không tìm thấy, không throw Error
  findById: (id, callback) => {
    Model.findById(id)
      .then(doc => callback(null, doc || null))
      .catch(err => callback(err));
  },

  // [C5] Đồng bộ về callback pattern
  create: (data, callback) => {
    Model.create(data)
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  },

  updateById: (id, data, callback) => {
    Model.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  },

  deleteById: (id, callback) => {
    Model.findByIdAndDelete(id)
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  },

  count: (filter = {}, callback) => {
    Model.countDocuments(filter)
      .then(n => callback(null, n))
      .catch(err => callback(err));
  }
});

module.exports = { createBaseRepository };
