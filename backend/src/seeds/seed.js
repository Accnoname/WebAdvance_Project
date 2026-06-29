const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Table = require('../models/Table.model');
const MenuItem = require('../models/MenuItem.model');
const QRCode = require('qrcode');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // 1. Xóa dữ liệu cũ
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('🧹 Đã xóa dữ liệu cũ');

    // 2. Tạo dữ liệu Bàn
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const qrUrl = `${clientUrl}/menu?table=${i}`;
      let qrCode = null;
      try {
        qrCode = await QRCode.toDataURL(qrUrl);
      } catch (err) {
        console.error('Lỗi tạo QR:', err);
      }

      tables.push({
        tableNumber: i,
        capacity: i <= 4 ? 2 : (i <= 8 ? 4 : 8),
        status: i === 3 ? 'dang_phuc_vu' : (i === 5 ? 'dat_truoc' : 'trong'),
        qrCode
      });
    }
    await Table.insertMany(tables);
    console.log(`✅ Đã tạo ${tables.length} bàn ăn`);

    // 3. Tạo dữ liệu Món ăn
    const menuItems = [
      {
        name: 'Gỏi Cuốn Tôm Thịt',
        description: 'Gỏi cuốn tươi ngon với tôm sú và thịt ba chỉ luộc, kèm tương đen đậu phộng.',
        category: 'khai_vi',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1551024506-0cb984251786?q=80&w=600&auto=format&fit=crop',
        prepareTime: 10
      },
      {
        name: 'Chả Giò Hải Sản',
        description: 'Chả giò chiên giòn nhân tôm cua mực, ăn kèm rau sống và nước mắm chua ngọt.',
        category: 'khai_vi',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=600&auto=format&fit=crop',
        prepareTime: 15
      },
      {
        name: 'Phở Bò Đặc Biệt',
        description: 'Phở bò tái nạm gầu gân bò viên, nước dùng hầm xương 24h ngọt thanh.',
        category: 'chinh',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?q=80&w=600&auto=format&fit=crop',
        prepareTime: 15
      },
      {
        name: 'Bún Chả Hà Nội',
        description: 'Thịt heo nướng than hoa thơm lừng, chả băm nướng lá lốt, ăn cùng bún tươi.',
        category: 'chinh',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1625471464718-d784a9ecdb17?q=80&w=600&auto=format&fit=crop',
        prepareTime: 20
      },
      {
        name: 'Cơm Tấm Sườn Bì Chả',
        description: 'Sườn nướng mật ong mềm mọng, bì heo dai ngon, chả trứng béo ngậy.',
        category: 'chinh',
        price: 60000,
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=600&auto=format&fit=crop',
        prepareTime: 15
      },
      {
        name: 'Cá Kho Tộ',
        description: 'Cá lóc kho tiêu cay nồng trong niêu đất, đậm đà đưa cơm.',
        category: 'chinh',
        price: 85000,
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop',
        prepareTime: 25
      },
      {
        name: 'Bánh Flan Caramel',
        description: 'Bánh flan mềm mịn, béo ngậy vị trứng sữa, phủ một lớp caramel ngọt đắng.',
        category: 'trang_mieng',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1509460913899-515f1df34fea?q=80&w=600&auto=format&fit=crop',
        prepareTime: 5
      },
      {
        name: 'Chè Khúc Bạch',
        description: 'Chè khúc bạch mát lạnh, ăn kèm nhãn lồng và hạnh nhân lát rang thơm.',
        category: 'trang_mieng',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1552689486-f6773047d19f?q=80&w=600&auto=format&fit=crop',
        prepareTime: 5
      },
      {
        name: 'Trà Sâm Dứa',
        description: 'Trà sâm dứa mát mẻ, thanh lọc cơ thể.',
        category: 'nuoc',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?q=80&w=600&auto=format&fit=crop',
        prepareTime: 5
      },
      {
        name: 'Sinh Tố Bơ',
        description: 'Sinh tố bơ Đắk Lắk béo ngậy, xay cùng sữa đặc.',
        category: 'nuoc',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1623065422900-050414f6b2f4?q=80&w=600&auto=format&fit=crop',
        prepareTime: 10
      }
    ];
    await MenuItem.insertMany(menuItems);
    console.log(`✅ Đã tạo ${menuItems.length} món ăn`);

    console.log('🎉 Quá trình seed dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedData();
