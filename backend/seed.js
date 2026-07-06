require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem.model');
const Table = require('./src/models/Table.model');

const items = [
  { name: 'Gỏi ngó sen tôm thịt', description: 'Khai vị chua ngọt kích thích vị giác', category: 'khai_vi', price: 120000, prepareTime: 10, image: 'https://images.unsplash.com/photo-1548943487-a2e4b43b485f?auto=format&fit=crop&q=80&w=400' },
  { name: 'Súp cua vi cá', description: 'Súp cua nóng hổi bồi bổ sức khỏe', category: 'khai_vi', price: 95000, prepareTime: 10, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400' },
  { name: 'Bò lúc lắc khoai tây', description: 'Bò Mỹ thượng hạng sốt đặc biệt', category: 'chinh', price: 250000, prepareTime: 20, image: 'https://images.unsplash.com/photo-1629226848149-fb933758814f?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cá chẽm sốt chanh dây', description: 'Cá chẽm phi lê áp chảo giòn da', category: 'chinh', price: 280000, prepareTime: 25, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=400' },
  { name: 'Bánh Flan Caramel', description: 'Bánh flan mềm mịn cùng caramel đắng nhẹ', category: 'trang_mieng', price: 45000, prepareTime: 5, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=400' },
  { name: 'Nước ép cam dứa', description: 'Tươi mát, nguyên chất 100%', category: 'nuoc', price: 55000, prepareTime: 5, image: 'https://images.unsplash.com/photo-1615486171439-fd0e1e69ce45?auto=format&fit=crop&q=80&w=400' },
];

const tables = [
  { tableNumber: 1, capacity: 4, status: 'trong' },
  { tableNumber: 2, capacity: 4, status: 'trong' },
  { tableNumber: 3, capacity: 6, status: 'trong' },
  { tableNumber: 4, capacity: 10, status: 'trong' },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Đang kết nối DB để thêm dữ liệu mẫu...');
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(items);
    console.log('✅ Đã thêm xong 6 món ăn vào Menu!');
    
    await Table.deleteMany({});
    await Table.insertMany(tables);
    console.log('✅ Đã thêm xong 4 Bàn!');
    
    process.exit(0);
  }).catch(e => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  });
