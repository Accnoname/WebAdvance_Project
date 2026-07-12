const TableRepository = require('../repositories/table.repository');
const QRCode = require('qrcode');
const { AppError } = require('../middlewares/error.middleware');
const Reservation = require('../models/Reservation.model');

const getAll = async () => {
  return new Promise((resolve, reject) => {
    TableRepository.findAll({}, { limit: 100 }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
};

// Kiểm tra tình trạng bàn theo ngày giờ đặt trước (biên độ ±2 tiếng)
const checkAvailability = async (date, time) => {
  // Lấy tất cả bàn
  const allTables = await new Promise((resolve, reject) => {
    TableRepository.findAll({}, { limit: 100 }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });

  // Tính khung giờ xung đột (khach chọn giờ ±2 tiếng)
  const [hours, minutes] = time.split(':').map(Number);
  const targetMinutes = hours * 60 + minutes;
  const BUFFER_MINUTES = 120; // 2 tiếng

  // Tìm các đơn đặt bàn trong cùng ngày, có khả năng xung đột giờ
  const conflictingReservations = await Reservation.find({
    reservationDate: {
      $gte: new Date(`${date}T00:00:00`),
      $lte: new Date(`${date}T23:59:59`)
    },
    status: { $in: ['cho_xac_nhan', 'da_xac_nhan'] },
    table: { $ne: null }
  }).select('table reservationTime');

  // Xác định những bàn đã bị đặt trong khung giờ
  const bookedTableIds = new Set();
  conflictingReservations.forEach(res => {
    const [rHours, rMinutes] = res.reservationTime.split(':').map(Number);
    const resMinutes = rHours * 60 + rMinutes;
    const diff = Math.abs(resMinutes - targetMinutes);
    if (diff < BUFFER_MINUTES) {
      bookedTableIds.add(res.table.toString());
    }
  });

  // Trả về danh sách bàn kèm trạng thái availability
  return allTables.map(table => ({
    ...table.toObject(),
    isAvailableForBooking: !bookedTableIds.has(table._id.toString()) && table.status !== 'dong'
  }));
};

const create = async (data) => {
  // Check if tableNumber already exists
  const existingTable = await new Promise((resolve, reject) => {
    TableRepository.findByTableNumber(data.tableNumber, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (existingTable) {
    throw new AppError(`Bàn số ${data.tableNumber} đã tồn tại`, 409);
  }

  // Create table first to get ID
  const newTable = await new Promise((resolve, reject) => {
    TableRepository.create(data, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  // Generate QR Code containing the URL to the menu with table number
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const qrUrl = `${clientUrl}/menu?table=${newTable.tableNumber}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);
    newTable.qrCode = qrCodeDataUrl;
    await newTable.save();
  } catch (err) {
    // [N5] QR Code lỗi không block tạo bàn
  }

  return newTable;
};

const updateStatus = async (id, status, currentOrder = null) => {
  const table = await new Promise((resolve, reject) => {
    TableRepository.findById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!table) {
    throw new AppError('Không tìm thấy bàn', 404);
  }
  
  table.status = status;
  if (currentOrder !== null) {
    table.currentOrder = currentOrder;
  }
  
  return await table.save();
};

const remove = async (id) => {
  const table = await new Promise((resolve, reject) => {
    TableRepository.findById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!table) {
    throw new AppError('Không tìm thấy bàn', 404);
  }
  if (table.status !== 'trong' && table.status !== 'dong') {
    throw new AppError('Chỉ có thể xóa bàn khi đang trống hoặc đóng cửa', 400);
  }

  // [M7] Nullify trường table trong các Reservation đang link đến bàn này
  await Reservation.updateMany(
    { table: id, status: { $in: ['cho_xac_nhan', 'da_xac_nhan'] } },
    { $set: { table: null } }
  );

  return await new Promise((resolve, reject) => {
    TableRepository.deleteById(id, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
};

module.exports = { getAll, checkAvailability, create, updateStatus, remove };
