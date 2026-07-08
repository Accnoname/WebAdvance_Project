const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const collection = db.collection('orders');
  const tableCollection = db.collection('tables');

  const tables = await tableCollection.find({}).toArray();
  const validIds = tables.map(t => t._id.toString());

  const allOrders = await collection.find({}).toArray();
  let deleted = 0;
  for (const order of allOrders) {
    const tableId = order.table ? order.table.toString() : null;
    if (!tableId || !validIds.includes(tableId)) {
      await collection.deleteOne({ _id: order._id });
      deleted++;
      console.log(`🗑️  Xóa: ${order._id} (table=${tableId}, type=${order.orderType})`);
    }
  }
  console.log(`✅ Đã xóa thêm ${deleted} orders. DB sạch!`);
  process.exit(0);
}).catch(e => { console.error('❌', e.message); process.exit(1); });
