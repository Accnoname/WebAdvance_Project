const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const Voucher = require('../models/Voucher.model');
const { getIO } = require('../config/socket');
const { AppError } = require('../middlewares/error.middleware');
const VoucherService = require('./voucher.service');

const validateAndCalculateVoucher = async (voucherCode, subTotal, isExistingOrder = false) => {
  if (!voucherCode) {
    return { voucherCode: null, discountAmount: 0, finalAmount: subTotal };
  }
  return await VoucherService.validateVoucher(voucherCode, subTotal, isExistingOrder);
};

const OrderService = {
  // [M4] Sanitize filter — chỉ cho phép các field an toàn, không nhận operator thô từ query
  getAll: async (query = {}) => {
    const filter = {};
    if (query.orderStatus) {
      filter.orderStatus = { $in: query.orderStatus.split(',') };
    }
    if (query.orderType)   filter.orderType   = query.orderType;
    if (query.table)       filter.table       = query.table;

    const page  = parseInt(query.page)  || 1;
    const limit = parseInt(query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate('table')
        .populate('customer', 'name email')
        .populate('orderedBy', 'name email')
        .populate('items.menuItem')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    return { data, total, page, limit };
  },

  getById: async (id) => {
    const order = await Order.findById(id)
      .populate('table')
      .populate('customer', 'name email')
      .populate('orderedBy', 'name email')
      .populate('items.menuItem');
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    return order;
  },

  getMyOrders: async (userId) => {
    return await Order.find({ $or: [{ customer: userId }, { orderedBy: userId }] })
      .populate('table')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
  },

  // [M2] Lấy chi tiết một đơn hàng — kiểm tra ownership của khách
  getMyOrderById: async (orderId, userId) => {
    const order = await Order.findById(orderId)
      .populate('table')
      .populate('items.menuItem')
      .populate('customer', 'name email');
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    // Kiểm tra đơn thuộc về user này
    const customerId = order.customer?._id?.toString() || order.customer?.toString();
    const orderedById = order.orderedBy?.toString();
    if (customerId !== userId.toString() && orderedById !== userId.toString()) {
      throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
    }
    return order;
  },

  create: async (data, user) => {
    // Validate table if orderType is 'tai_ban'
    let table = null;
    if (data.orderType === 'tai_ban' || data.tableId) {
      table = await Table.findById(data.tableId);
      if (!table) throw new AppError('Bàn không tồn tại', 404);
      // [C4] Chặn đặt đơn khi bàn đang có khách hoặc đóng cửa
      if (table.status === 'dang_phuc_vu') {
        throw new AppError(`Bàn ${table.tableNumber} đang có khách, không thể đặt thêm`, 400);
      }
      if (table.status === 'dong') {
        throw new AppError(`Bàn ${table.tableNumber} đang đóng cửa`, 400);
      }
    }

    // Get prices and calculate total
    let totalAmount = 0;
    const processedItems = [];

    for (const item of data.items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) throw new AppError(`Món ăn ID ${item.menuItemId} không tồn tại`, 404);
      if (!menuItem.isAvailable) throw new AppError(`Món ${menuItem.name} hiện đã hết`, 400);

      const price = menuItem.price; // snapshot price
      totalAmount += price * item.quantity;

      processedItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price,
        note: item.note || '',
        status: 'cho_xac_nhan'
      });
    }

    // Validate voucher if provided
    let voucherCode = null;
    let discountAmount = 0;
    let finalAmount = totalAmount;

    let reservedVoucherCode = null;

    try {
      if (data.voucherCode) {
        const uppercaseCode = data.voucherCode.toUpperCase();
        const unpaidQuery = {
          voucherCode: uppercaseCode,
          orderStatus: 'moi',
          isPaid: false
        };

        if (user && user.role === 'khach_hang') {
          unpaidQuery.customer = user._id;
        } else if (table) {
          unpaidQuery.table = table._id;
        }

        if (unpaidQuery.customer || unpaidQuery.table) {
          const priorUnpaidOrders = await Order.find(unpaidQuery);
          for (const priorOrder of priorUnpaidOrders) {
            await OrderService.updateStatus(priorOrder._id, 'da_huy');
          }
        }

        const voucherCalc = await validateAndCalculateVoucher(data.voucherCode, totalAmount, false);
        voucherCode = voucherCalc.voucherCode;
        discountAmount = voucherCalc.discountAmount;
        finalAmount = voucherCalc.finalAmount;

        const now = new Date();
        const updatedVoucher = await Voucher.findOneAndUpdate(
          {
            code: uppercaseCode,
            isAvailable: true,
            expiryDate: { $gt: now },
            $or: [
              { maxUses: null },
              { $expr: { $lt: ["$usedCount", "$maxUses"] } }
            ]
          },
          { $inc: { usedCount: 1 } },
          { new: true }
        );

        if (!updatedVoucher) {
          throw new AppError('Mã giảm giá đã hết lượt sử dụng hoặc không khả dụng', 400);
        }
        reservedVoucherCode = voucherCode;
      }

      const order = new Order({
        orderType: data.orderType || 'tai_ban',
        table: table ? table._id : null,
        deliveryAddress: data.deliveryAddress || null,
        deliveryPhone: data.deliveryPhone || null,
        customer: user?.role === 'khach_hang' ? user._id : null,
        orderedBy: user ? user._id : null,
        items: processedItems,
        totalAmount,
        voucherCode,
        discountAmount,
        finalAmount,
        note: data.note || ''
      });

      await order.save();

      // Update table status
      if (table && (table.status === 'trong' || table.status === 'dat_truoc')) {
        table.status = 'dang_phuc_vu';
        table.currentOrder = order._id;
        await table.save();
      }

      // Populate for socket
      await order.populate('table');
      await order.populate('items.menuItem');
      await order.populate('customer', 'name');

      // Emit socket events
      const io = getIO();
      if (io) {
        io.to('kitchen').emit('order:new', order);
        io.to('staff').emit('order:new', order);
        if (table) {
          io.to('staff').emit('table:status-changed', { tableId: table._id, status: table.status });
        }
      }

      return order;
    } catch (error) {
      if (reservedVoucherCode) {
        await Voucher.updateOne(
          { code: reservedVoucherCode.toUpperCase() },
          { $inc: { usedCount: -1 } }
        );
      }
      throw error;
    }
  },

  addItems: async (orderId, newItems) => {
    const order = await Order.findById(orderId).populate('table');
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    if (['hoan_thanh', 'da_huy'].includes(order.orderStatus)) {
      throw new AppError('Không thể thêm món vào đơn hàng đã đóng', 400);
    }

    let additionalAmount = 0;
    const processedItems = [];

    for (const item of newItems) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) throw new AppError(`Món ăn ID ${item.menuItemId} không tồn tại`, 404);
      if (!menuItem.isAvailable) throw new AppError(`Món ${menuItem.name} hiện đã hết`, 400);

      const price = menuItem.price;
      additionalAmount += price * item.quantity;

      processedItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price,
        note: item.note || '',
        status: 'cho_xac_nhan'
      });
    }

    order.items.push(...processedItems);
    order.totalAmount += additionalAmount;

    if (order.voucherCode) {
      const voucherCalc = await validateAndCalculateVoucher(order.voucherCode, order.totalAmount, true);
      order.discountAmount = voucherCalc.discountAmount;
      order.finalAmount = voucherCalc.finalAmount;
    } else {
      order.finalAmount = order.totalAmount;
    }

    await order.save();
    await order.populate('items.menuItem');
    await order.populate('customer', 'name');

    // Emit socket events
    const io = getIO();
    if (io) {
      io.to('kitchen').emit('order:new', order); // Notify kitchen of new items (by sending updated order or custom event, but 'order:new' works for now or we can handle in frontend)
      io.to('staff').emit('order:status-changed', { orderId: order._id, status: order.orderStatus });
      const tableId = order.table?._id || order.table;
      if (tableId) {
        io.to(`table:${tableId}`).emit('order:status-changed', { orderId: order._id, status: order.orderStatus });
      }
    }

    return order;
  },

  updateStatus: async (orderId, orderStatus, paymentMethod) => {
    const order = await Order.findById(orderId).populate('table');
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    // [C1] Lưu tableId TRƯỚC khi có thể bị reset về null
    const tableId = order.table?._id || order.table || null;

    if (orderStatus === 'da_huy' && order.orderStatus !== 'da_huy' && order.voucherCode) {
      await Voucher.updateOne(
        { code: order.voucherCode.toUpperCase() },
        { $inc: { usedCount: -1 } }
      );
    }

    order.orderStatus = orderStatus;

    // Nếu hoàn thành hoặc hủy → giải phóng bàn
    if (['hoan_thanh', 'da_huy'].includes(orderStatus)) {
      if (orderStatus === 'hoan_thanh' && paymentMethod) {
        order.paymentMethod = paymentMethod;
      }
      if (tableId) {
        const table = await Table.findById(tableId);
        if (table) {
          table.status = 'trong';
          table.currentOrder = null;
          await table.save();

          const io = getIO();
          if (io) {
            io.to('staff').emit('table:status-changed', { tableId: table._id, status: 'trong' });
          }
        }
      }
    }

    if (order.finalAmount === undefined || order.finalAmount === null) {
      order.finalAmount = order.totalAmount;
    }

    await order.save();

    // [C1] Dùng tableId đã lưu, không dùng order.table (có thể đã null)
    const io = getIO();
    if (io) {
      if (tableId) {
        io.to(`table:${tableId}`).emit('order:status-changed', { orderId, status: orderStatus });
      }
      io.to('staff').emit('order:status-changed', { orderId, status: orderStatus });
      io.to('kitchen').emit('order:status-changed', { orderId, status: orderStatus });
    }

    return order;
  },

  updateItemStatus: async (orderId, itemId, status) => {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const item = order.items.id(itemId);
    if (!item) throw new AppError('Không tìm thấy món trong đơn', 404);

    const oldStatus = item.status;
    item.status = status;
    
    // Auto-update order status if cooking started
    let orderStatusChanged = false;
    if (status === 'dang_che_bien' && order.orderStatus === 'moi') {
      order.orderStatus = 'dang_xu_ly';
      orderStatusChanged = true;
    }

    // Nếu món bị hủy và trạng thái cũ hợp lệ (bếp chưa làm xong)
    if (status === 'huy' && ['cho_xac_nhan', 'dang_che_bien'].includes(oldStatus)) {
      order.totalAmount -= (item.price * item.quantity);
      if (order.totalAmount < 0) order.totalAmount = 0;

      if (order.voucherCode) {
        const voucher = await Voucher.findOne({ code: order.voucherCode.toUpperCase() });
        if (voucher && order.totalAmount < voucher.minOrderAmount) {
          order.voucherCode = null;
          order.discountAmount = 0;
          order.finalAmount = order.totalAmount;
          await Voucher.updateOne(
            { code: voucher.code },
            { $inc: { usedCount: -1 } }
          );
        } else if (voucher) {
          let discountAmount = 0;
          if (voucher.discountType === 'percentage') {
            discountAmount = Math.floor(order.totalAmount * (voucher.discountValue / 100));
          } else if (voucher.discountType === 'fixed') {
            discountAmount = voucher.discountValue;
          }
          discountAmount = Math.max(0, Math.min(discountAmount, order.totalAmount));
          order.discountAmount = discountAmount;
          order.finalAmount = order.totalAmount - discountAmount;
        } else {
          order.voucherCode = null;
          order.discountAmount = 0;
          order.finalAmount = order.totalAmount;
        }
      } else {
        order.finalAmount = order.totalAmount;
      }
    }

    if (order.finalAmount === undefined || order.finalAmount === null) {
      order.finalAmount = order.totalAmount;
    }

    await order.save();
    await order.populate('items.menuItem');
    await order.populate('table'); // Populate table for socket data

    const io = getIO();
    if (io) {
      // Emit order status change if it auto-updated
      if (orderStatusChanged) {
        io.to('staff').emit('order:status-changed', { orderId, status: 'dang_xu_ly' });
        io.to('kitchen').emit('order:status-changed', { orderId, status: 'dang_xu_ly' });
        if (order.table) {
          io.to(`table:${order.table._id}`).emit('order:status-changed', { orderId, status: 'dang_xu_ly' });
        }
      }

      const tableIdObj = order.table ? order.table._id : order.table;
      io.to(`table:${tableIdObj}`).emit('order:item-updated', { orderId, itemId, status });
      io.to('staff').emit('order:item-updated', { orderId, itemId, status });
      io.to('kitchen').emit('order:item-updated', { orderId, itemId, status });

      // Notifications for staff
      const tableNumber = order.table?.tableNumber || '?';
      const itemName = item.menuItem?.name || 'Món ăn';
      
      if (status === 'cho_phuc_vu') {
        io.to('staff').emit('notification', {
          title: 'Đồ ăn đã ra quầy!',
          message: `Món ${itemName} của Bàn ${tableNumber} đã nấu xong, chờ bưng lên.`,
          type: 'info',
          orderId: orderId
        });
      }
      
      if (status === 'hoan_thanh') {
        const activeItems = order.items.filter(i => i.status !== 'huy');
        const allDone = activeItems.length > 0 && activeItems.every(i => i.status === 'hoan_thanh');
        if (allDone) {
          io.to('staff').emit('notification', {
            title: 'Lên đủ đồ!',
            message: `Bàn ${tableNumber} đã lên đủ đồ ăn.`,
            type: 'success',
            orderId: orderId
          });
        }
      }
    }

    return order;
  },

  submitReview: async (orderId, userId, rating, comment) => {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const customerId = order.customer?._id?.toString() || order.customer?.toString();
    const orderedById = order.orderedBy?.toString();
    if (customerId !== userId.toString() && orderedById !== userId.toString()) {
      throw new AppError('Bạn không có quyền đánh giá đơn hàng này', 403);
    }

    if (order.orderStatus !== 'hoan_thanh') {
      throw new AppError('Chỉ có thể đánh giá những đơn hàng đã hoàn thành', 400);
    }

    if (order.review && order.review.rating) {
      throw new AppError('Đơn hàng này đã được đánh giá trước đó', 400);
    }

    order.review = {
      rating: parseInt(rating),
      comment: comment || '',
      reviewedAt: new Date()
    };

    await order.save();
    return order;
  }
};

module.exports = OrderService;
