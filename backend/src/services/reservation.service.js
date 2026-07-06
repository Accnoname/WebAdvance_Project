const ReservationRepository = require('../repositories/reservation.repository');
const TableRepository = require('../repositories/table.repository');
const { AppError } = require('../middlewares/error.middleware');

const create = async (data) => {
  // [M3] Kiểm tra trùng lịch: cùng ngày + cùng giờ + cùng bàn (nếu có)
  if (data.reservationDate && data.reservationTime) {
    const conflict = await new Promise((resolve, reject) => {
      ReservationRepository.findAllWithDetails({
        reservationDate: new Date(data.reservationDate),
        reservationTime: data.reservationTime,
        status: { $in: ['cho_xac_nhan', 'da_xac_nhan'] },
        ...(data.table ? { table: data.table } : {})
      }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
    if (conflict && conflict.length > 0) {
      throw new AppError('Đã có đặt bàn vào khung giờ này, vui lòng chọn giờ khác', 409);
    }
  }

  return await new Promise((resolve, reject) => {
    ReservationRepository.create(data, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
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
    await new Promise((resolve, reject) => {
      TableRepository.updateById(tableId, { status: 'dat_truoc' }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  const updated = await new Promise((resolve, reject) => {
    ReservationRepository.updateById(id, updateData, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
  if (!updated) throw new AppError('Không tìm thấy đơn đặt bàn', 404);
  return updated;
};

module.exports = { create, getAll, updateStatus };
