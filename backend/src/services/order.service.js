const Order = require('../models/Order.model');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const { getIO } = require('../config/socket');
const { AppError } = require('../middlewares/error.middleware');

const OrderService = {
  getAll: async (filter = {}) => {
    return await Order.find(filter)
      .populate('table')
      .populate('customer', 'name email')
      .populate('orderedBy', 'name email')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
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

  create: async (data, user) => {
    // Validate table if orderType is 'tai_ban'
    let table = null;
    if (data.orderType === 'tai_ban' || data.tableId) {
      table = await Table.findById(data.tableId);
      if (!table) throw new AppError('Bàn không tồn tại', 404);
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

    const order = new Order({
      orderType: data.orderType || 'tai_ban',
      table: table ? table._id : null,
      deliveryAddress: data.deliveryAddress || null,
      deliveryPhone: data.deliveryPhone || null,
      customer: user?.role === 'khach_hang' ? user._id : null,
      orderedBy: user ? user._id : null,
      items: processedItems,
      totalAmount,
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
  },

  updateStatus: async (orderId, orderStatus) => {
    const order = await Order.findById(orderId).populate('table');
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    order.orderStatus = orderStatus;
    
    // If completed or cancelled, free the table
    if (['hoan_thanh', 'da_huy'].includes(orderStatus) && order.table) {
      const table = await Table.findById(order.table._id);
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

    await order.save();

    const io = getIO();
    if (io) {
      io.to(`table:${order.table._id}`).emit('order:status-changed', { orderId, status: orderStatus });
      io.to('staff').emit('order:status-changed', { orderId, status: orderStatus });
    }

    return order;
  },

  updateItemStatus: async (orderId, itemId, status) => {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const item = order.items.id(itemId);
    if (!item) throw new AppError('Không tìm thấy món trong đơn', 404);

    item.status = status;
    
    // Check if all items are completed to auto-complete the order?
    // Maybe keep it manual for now.

    await order.save();
    await order.populate('items.menuItem');

    const io = getIO();
    if (io) {
      io.to(`table:${order.table}`).emit('order:item-updated', { orderId, itemId, status });
      io.to('staff').emit('order:item-updated', { orderId, itemId, status });
      io.to('kitchen').emit('order:item-updated', { orderId, itemId, status });
    }

    return order;
  }
};

module.exports = OrderService;
