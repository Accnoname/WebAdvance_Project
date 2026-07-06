const Voucher = require('../models/Voucher.model');
const { createBaseRepository } = require('./base.repository');

const VoucherRepository = {
  ...createBaseRepository(Voucher),

  findByCode: (code, callback) => {
    const uppercaseCode = typeof code === 'string' ? code.toUpperCase() : '';
    Voucher.findOne({ code: uppercaseCode })
      .then(doc => callback(null, doc))
      .catch(err => callback(err));
  }
};

module.exports = VoucherRepository;
