const ReservationRepository = require('../repositories/reservation.repository');
const TableRepository = require('../repositories/table.repository');
const { AppError } = require('../middlewares/error.middleware');

const create = async (data) => {
  return await ReservationRepository.create(data);
};

const getAll = async (query = {}) => {
  return await new Promise((resolve, reject) => {
    ReservationRepository.findAllWithDetails(query, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
};

const updateStatus = async (id, status, tableId = null) => {
  const updateData = { status };
  
  // Nếu xác nhận và có gán bàn, ta tự động chuyển trạng thái bàn thành dat_truoc
  if (status === 'da_xac_nhan' && tableId) {
    const table = await new Promise((resolve, reject) => {
      TableRepository.findById(tableId, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });

    if (!table) throw new AppError('Bàn không tồn tại', 404);
    
    updateData.table = tableId;
    await TableRepository.updateById(tableId, { status: 'dat_truoc' });
  }

  const updated = await ReservationRepository.updateById(id, updateData);
  if (!updated) throw new AppError('Không tìm thấy đơn đặt bàn', 404);
  return updated;
};

module.exports = { create, getAll, updateStatus };
