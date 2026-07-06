// Base Repository — chứa các hàm CRUD dùng chung theo error-first callback
const createBaseRepository = (Model) => ({
  findAll: (filter = {}, options = {}, callback) => {
    Model.find(filter)
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .then(docs => typeof callback === 'function' && callback(null, docs))
      .catch(err => typeof callback === 'function' ? callback(err) : console.error('findAll Error:', err));
  },

  // [N1] Trả về null khi không tìm thấy, không throw Error
  findById: (id, callback) => {
    Model.findById(id)
      .then(doc => typeof callback === 'function' && callback(null, doc || null))
      .catch(err => typeof callback === 'function' ? callback(err) : console.error('findById Error:', err));
  },

  // [C5] Đồng bộ về callback pattern
  create: (data, callback) => {
    Model.create(data)
      .then(doc => typeof callback === 'function' && callback(null, doc))
      .catch(err => typeof callback === 'function' ? callback(err) : console.error('create Error:', err));
  },

  updateById: (id, data, callback) => {
    Model.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .then(doc => typeof callback === 'function' && callback(null, doc))
      .catch(err => typeof callback === 'function' ? callback(err) : console.error('updateById Error:', err));
  },

  deleteById: (id, callback) => {
    Model.findByIdAndDelete(id)
      .then(doc => typeof callback === 'function' && callback(null, doc))
      .catch(err => typeof callback === 'function' ? callback(err) : console.error('deleteById Error:', err));
  },

  count: (filter = {}, callback) => {
    if (typeof filter === 'function') {
      callback = filter;
      filter = {};
    }
    Model.countDocuments(filter)
      .then(n => typeof callback === 'function' && callback(null, n))
      .catch(err => typeof callback === 'function' ? callback(err) : console.error('count Error:', err));
  }
});

module.exports = { createBaseRepository };
