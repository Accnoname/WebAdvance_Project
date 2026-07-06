/**
 * Script Seed Dữ Liệu Thử Nghiệm
 * Chạy: node seed-test-data.js
 * Thêm: 3 nhân viên + 5 voucher mẫu vào DB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User.model');
const Voucher = require('./src/models/Voucher.model');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // ── SEED NHÂN VIÊN ──────────────────────────────────────
    const staffData = [
      { name: 'Nguyễn Văn Phục Vụ', email: 'phuvu1@restaurant.com', phone: '0901111001', role: 'nhan_vien' },
      { name: 'Trần Thị Bếp Chính',  email: 'bep1@restaurant.com',   phone: '0901111002', role: 'nhan_vien' },
      { name: 'Lê Hoàng Thu Ngân',   email: 'thungan1@restaurant.com',phone: '0901111003', role: 'nhan_vien' },
    ];

    let staffCreated = 0;
    for (const s of staffData) {
      const exists = await User.findOne({ email: s.email });
      if (!exists) {
        const hashed = await bcrypt.hash('123456', 10);
        await User.create({ ...s, password: hashed, isActive: true });
        staffCreated++;
        console.log(`  ➕ Tạo nhân viên: ${s.name} (${s.email}) — mật khẩu: 123456`);
      } else {
        console.log(`  ⏭️  Bỏ qua (đã tồn tại): ${s.email}`);
      }
    }
    console.log(`\n✅ Nhân viên: đã tạo ${staffCreated} / ${staffData.length}`);

    // ── SEED VOUCHER ─────────────────────────────────────────
    const future = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    const voucherData = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxUses: 100,
        expiryDate: future(90),
        description: 'Giảm 10% cho khách mới',
        isAvailable: true,
      },
      {
        code: 'SUMMER50K',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderAmount: 300000,
        maxUses: 50,
        expiryDate: future(30),
        description: 'Giảm 50,000đ đơn từ 300k — hè 2026',
        isAvailable: true,
      },
      {
        code: 'VIP20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 500000,
        maxUses: 20,
        expiryDate: future(60),
        description: 'Ưu đãi 20% cho khách VIP',
        isAvailable: true,
      },
      {
        code: 'FREESHIP',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderAmount: 150000,
        maxUses: null,
        expiryDate: future(120),
        description: 'Giảm 30k không giới hạn lượt',
        isAvailable: true,
      },
      {
        code: 'EXPIRED99',
        discountType: 'percentage',
        discountValue: 99,
        minOrderAmount: 0,
        maxUses: 1,
        expiryDate: new Date('2025-01-01'), // Đã hết hạn — để test
        description: 'Voucher đã hết hạn (để test)',
        isAvailable: false,
      },
    ];

    let voucherCreated = 0;
    for (const v of voucherData) {
      const exists = await Voucher.findOne({ code: v.code });
      if (!exists) {
        await Voucher.create(v);
        voucherCreated++;
        console.log(`  ➕ Tạo voucher: ${v.code} — ${v.description}`);
      } else {
        console.log(`  ⏭️  Bỏ qua (đã tồn tại): ${v.code}`);
      }
    }
    console.log(`\n✅ Voucher: đã tạo ${voucherCreated} / ${voucherData.length}`);

    console.log('\n🎉 Seed hoàn tất! Kiểm tra:');
    console.log('   → /manager/staff    — Danh sách nhân viên');
    console.log('   → /manager/vouchers — Danh sách voucher');
    console.log('   → Nhân viên mẫu login bằng mật khẩu: 123456');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
