const TableRepository = require('../repositories/table.repository');
const QRCode = require('qrcode');
const { AppError } = require('../middlewares/error.middleware');

const getAll = async () => {
  return new Promise((resolve, reject) => {
    TableRepository.findAll({}, { limit: 100 }, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
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
  const newTable = await TableRepository.create(data);

  // Generate QR Code containing the URL to the menu with table number
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const qrUrl = `${clientUrl}/menu?table=${newTable.tableNumber}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);
    newTable.qrCode = qrCodeDataUrl;
    await newTable.save();
  } catch (err) {
    console.error('Lỗi tạo QR Code:', err);
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

module.exports = { getAll, create, updateStatus };
