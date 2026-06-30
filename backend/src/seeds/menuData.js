const menuItems = [
  // ─── SIGNATURE DISHES ───────────────────────────────────────
  {
    name: 'Steak Bò Wagyu A5',
    description: 'Thịt bò Wagyu hạng A5 từ Nhật Bản, áp chảo vừa chín tới với bơ thảo mộc, kèm nấm truffle đen và sốt demi-glace hầm 12 tiếng.',
    category: 'chinh',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop',
    prepareTime: 25,
    isAvailable: true
  },
  {
    name: 'Cá Hồi Na Uy Áp Chảo',
    description: 'Phi lê cá hồi Na Uy áp chảo da giòn, ăn kèm măng tây nướng, sốt chanh leo và dầu olive nguyên chất hạng nhất.',
    category: 'chinh',
    price: 320000,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop',
    prepareTime: 20,
    isAvailable: true
  },
  {
    name: 'Súp Nấm Truffle Đen',
    description: 'Súp kem nấm rừng phức hợp với lát truffle đen tươi nhập khẩu, rắc thêm parmesan bào và dầu truffle trắng Ý.',
    category: 'khai_vi',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1548943487-a2e4b43b4859?q=80&w=800&auto=format&fit=crop',
    prepareTime: 15,
    isAvailable: true
  },

  // ─── MÙA XUÂN ───────────────────────────────────────────────
  {
    name: 'Gỏi Ngó Sen Tôm Càng',
    description: 'Ngó sen giòn sần sật kết hợp tôm càng sông tươi, sốt mè rang đặc biệt.',
    category: 'khai_vi',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=600&auto=format&fit=crop',
    prepareTime: 15,
    isAvailable: true
  },
  {
    name: 'Canh Khổ Qua Nhồi Thịt',
    description: 'Khổ qua nhồi thịt heo xay nấu với nước dùng xương hầm ngọt thanh.',
    category: 'chinh',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600&auto=format&fit=crop',
    prepareTime: 20,
    isAvailable: true
  },
  {
    name: 'Chả Cá Lá Lốt Non',
    description: 'Chả cá chiên trong lá lốt non mùa xuân, thơm nồng, ăn kèm bún tươi và rau sống.',
    category: 'khai_vi',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?q=80&w=600&auto=format&fit=crop',
    prepareTime: 15,
    isAvailable: true
  },

  // ─── MÙA HẠ ─────────────────────────────────────────────────
  {
    name: 'Gỏi Xoài Xanh Tôm Thịt',
    description: 'Xoài xanh chua giòn trộn cùng tôm thịt, đậu phộng rang, nước mắm chua ngọt đậm đà.',
    category: 'khai_vi',
    price: 110000,
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=600&auto=format&fit=crop',
    prepareTime: 12,
    isAvailable: true
  },
  {
    name: 'Chè Đậu Xanh Hạt Sen',
    description: 'Chè mát lạnh đậu xanh cà, hạt sen bùi bùi, nước cốt dừa béo thơm.',
    category: 'trang_mieng',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&auto=format&fit=crop',
    prepareTime: 5,
    isAvailable: true
  },
  {
    name: 'Lẩu Chua Cá Lóc',
    description: 'Lẩu chua me thanh vị, cá lóc đồng tươi sống, rau muống non và giá đỗ giòn.',
    category: 'chinh',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&auto=format&fit=crop',
    prepareTime: 25,
    isAvailable: true
  },

  // ─── MÙA THU ────────────────────────────────────────────────
  {
    name: 'Gà Tiềm Hạt Sen Kỷ Tử',
    description: 'Gà ta tiềm thuốc bắc nhẹ, hạt sen bùi, kỷ tử ngọt, nước tiềm vàng óng.',
    category: 'chinh',
    price: 185000,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop',
    prepareTime: 30,
    isAvailable: true
  },
  {
    name: 'Canh Bí Đỏ Nấu Xương',
    description: 'Bí đỏ Đà Lạt ngọt bùi hầm với xương ống, thêm hành phi và tiêu sọ thơm.',
    category: 'chinh',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=600&auto=format&fit=crop',
    prepareTime: 20,
    isAvailable: true
  },
  {
    name: 'Cơm Nấm Hương Hầm',
    description: 'Cơm gạo lứt nấu cùng nấm hương đông cô, nước hầm rau củ, chan dầu mè thơm lừng.',
    category: 'chinh',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?q=80&w=600&auto=format&fit=crop',
    prepareTime: 25,
    isAvailable: true
  },

  // ─── MÙA ĐÔNG ───────────────────────────────────────────────
  {
    name: 'Lẩu Mắm Cá Linh Bông Súng',
    description: 'Lẩu mắm đặc sản miền Tây, cá linh đồng mùa nước nổi, bông súng tím giòn.',
    category: 'chinh',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&auto=format&fit=crop',
    prepareTime: 25,
    isAvailable: true
  },
  {
    name: 'Vịt Nấu Chao Gừng',
    description: 'Vịt ta nấu chao đậu hũ béo mịn, gừng tươi ấm bụng, ăn kèm bánh mì nóng.',
    category: 'chinh',
    price: 220000,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600&auto=format&fit=crop',
    prepareTime: 30,
    isAvailable: true
  },
  {
    name: 'Chè Khoai Dừa Nước',
    description: 'Khoai lang tím, khoai mỡ, khoai mì dẻo bùi, nước cốt dừa sánh mịn chan ấm.',
    category: 'trang_mieng',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&auto=format&fit=crop',
    prepareTime: 10,
    isAvailable: true
  },

  // ─── MÓN CƠ BẢN QUEN THUỘC ──────────────────────────────────
  {
    name: 'Gỏi Cuốn Tôm Thịt',
    description: 'Gỏi cuốn tươi ngon với tôm sú và thịt ba chỉ luộc, kèm tương đen đậu phộng.',
    category: 'khai_vi',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1551024506-0cb984251786?q=80&w=600&auto=format&fit=crop',
    prepareTime: 10,
    isAvailable: true
  },
  {
    name: 'Chả Giò Hải Sản',
    description: 'Chả giò chiên giòn nhân tôm cua mực, ăn kèm rau sống và nước mắm chua ngọt.',
    category: 'khai_vi',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=600&auto=format&fit=crop',
    prepareTime: 15,
    isAvailable: true
  },
  {
    name: 'Phở Bò Đặc Biệt',
    description: 'Phở bò tái nạm gầu gân bò viên, nước dùng hầm xương 24h ngọt thanh.',
    category: 'chinh',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?q=80&w=600&auto=format&fit=crop',
    prepareTime: 15,
    isAvailable: true
  },
  {
    name: 'Bún Chả Hà Nội',
    description: 'Thịt heo nướng than hoa thơm lừng, chả băm nướng lá lốt, ăn cùng bún tươi.',
    category: 'chinh',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1625471464718-d784a9ecdb17?q=80&w=600&auto=format&fit=crop',
    prepareTime: 20,
    isAvailable: true
  },
  {
    name: 'Cơm Tấm Sườn Bì Chả',
    description: 'Sườn nướng mật ong mềm mọng, bì heo dai ngon, chả trứng béo ngậy.',
    category: 'chinh',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=600&auto=format&fit=crop',
    prepareTime: 15,
    isAvailable: true
  },
  {
    name: 'Cá Kho Tộ',
    description: 'Cá lóc kho tiêu cay nồng trong niêu đất, đậm đà đưa cơm.',
    category: 'chinh',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop',
    prepareTime: 25,
    isAvailable: true
  },
  {
    name: 'Bánh Flan Caramel',
    description: 'Bánh flan mềm mịn, béo ngậy vị trứng sữa, phủ một lớp caramel ngọt đắng.',
    category: 'trang_mieng',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1509460913899-515f1df34fea?q=80&w=600&auto=format&fit=crop',
    prepareTime: 5,
    isAvailable: true
  },
  {
    name: 'Chè Khúc Bạch',
    description: 'Chè khúc bạch mát lạnh, ăn kèm nhãn lồng và hạnh nhân lát rang thơm.',
    category: 'trang_mieng',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1552689486-f6773047d19f?q=80&w=600&auto=format&fit=crop',
    prepareTime: 5,
    isAvailable: true
  },
  {
    name: 'Trà Sâm Dứa',
    description: 'Trà sâm dứa mát mẻ, thanh lọc cơ thể.',
    category: 'nuoc',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?q=80&w=600&auto=format&fit=crop',
    prepareTime: 5,
    isAvailable: true
  },
  {
    name: 'Sinh Tố Bơ',
    description: 'Sinh tố bơ Đắk Lắk béo ngậy, xay cùng sữa đặc.',
    category: 'nuoc',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1623065422900-050414f6b2f4?q=80&w=600&auto=format&fit=crop',
    prepareTime: 10,
    isAvailable: true
  }
];

module.exports = menuItems;
