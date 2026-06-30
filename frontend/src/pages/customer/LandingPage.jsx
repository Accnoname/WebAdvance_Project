import { Link } from 'react-router-dom';
import useInView from '../../hooks/useInView';
import { ArrowRight, Star, Clock, MapPin, Phone, Leaf, Flame, Snowflake, Sun, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// ─── DỮ LIỆU MÙA ─────────────────────────────────────────────
const ALL_SEASONS = [
  {
    key: 'xuan', label: 'Mùa Xuân', months: [1, 2, 3],
    icon: Leaf, accent: '#6ee7b7', bg: 'from-emerald-950 via-[#0a1f15] to-[#0f0a05]',
    tagline: 'Tháng 2 — 4 | Tươi mát, thanh đạm',
    dishes: [
      { name: 'Gỏi Ngó Sen Tôm Càng', desc: 'Ngó sen giòn sần sật kết hợp tôm càng sông tươi, sốt mè rang đặc biệt.', img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=600&auto=format&fit=crop' },
      { name: 'Canh Khổ Qua Nhồi Thịt', desc: 'Khổ qua nhồi thịt heo xay nấu với nước dùng xương hầm ngọt thanh.', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600&auto=format&fit=crop' },
      { name: 'Chả Cá Lá Lốt Non', desc: 'Chả cá chiên trong lá lốt non mùa xuân, thơm nồng, ăn kèm bún tươi và rau sống.', img: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?q=80&w=600&auto=format&fit=crop' },
    ],
  },
  {
    key: 'ha', label: 'Mùa Hạ', months: [4, 5, 6],
    icon: Sun, accent: '#fcd34d', bg: 'from-amber-950 via-[#1f1500] to-[#0f0a05]',
    tagline: 'Tháng 5 — 7 | Mát lạnh, sảng khoái',
    dishes: [
      { name: 'Gỏi Xoài Xanh Tôm Thịt', desc: 'Xoài xanh chua giòn trộn cùng tôm thịt, đậu phộng rang, nước mắm chua ngọt đậm đà.', img: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=600&auto=format&fit=crop' },
      { name: 'Chè Đậu Xanh Hạt Sen', desc: 'Chè mát lạnh đậu xanh cà, hạt sen bùi bùi, nước cốt dừa béo thơm.', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&auto=format&fit=crop' },
      { name: 'Lẩu Chua Cá Lóc', desc: 'Lẩu chua me thanh vị, cá lóc đồng tươi sống, rau muống non và giá đỗ giòn.', img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&auto=format&fit=crop' },
    ],
  },
  {
    key: 'thu', label: 'Mùa Thu', months: [7, 8, 9],
    icon: Flame, accent: '#fb923c', bg: 'from-orange-950 via-[#1a0e00] to-[#0f0a05]',
    tagline: 'Tháng 8 — 10 | Ấm nồng, bổ dưỡng',
    dishes: [
      { name: 'Gà Tiềm Hạt Sen Kỷ Tử', desc: 'Gà ta tiềm thuốc bắc nhẹ, hạt sen bùi, kỷ tử ngọt, nước tiềm vàng óng.', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop' },
      { name: 'Canh Bí Đỏ Nấu Xương', desc: 'Bí đỏ Đà Lạt ngọt bùi hầm với xương ống, thêm hành phi và tiêu sọ thơm.', img: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=600&auto=format&fit=crop' },
      { name: 'Cơm Nấm Hương Hầm', desc: 'Cơm gạo lứt nấu cùng nấm hương đông cô, nước hầm rau củ, chan dầu mè thơm lừng.', img: 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?q=80&w=600&auto=format&fit=crop' },
    ],
  },
  {
    key: 'dong', label: 'Mùa Đông', months: [10, 11, 12],
    icon: Snowflake, accent: '#93c5fd', bg: 'from-blue-950 via-[#050d1a] to-[#0f0a05]',
    tagline: 'Tháng 11 — 1 | Ủ ấm, đậm vị',
    dishes: [
      { name: 'Lẩu Mắm Cá Linh Bông Súng', desc: 'Lẩu mắm đặc sản miền Tây, cá linh đồng mùa nước nổi, bông súng tím giòn.', img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=600&auto=format&fit=crop' },
      { name: 'Vịt Nấu Chao Gừng', desc: 'Vịt ta nấu chao đậu hũ béo mịn, gừng tươi ấm bụng, ăn kèm bánh mì nóng.', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600&auto=format&fit=crop' },
      { name: 'Chè Khoai Dừa Nước', desc: 'Khoai lang tím, khoai mỡ, khoai mì dẻo bùi, nước cốt dừa sánh mịn chan ấm.', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600&auto=format&fit=crop' },
    ],
  },
];

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1–12
  return ALL_SEASONS.find(s => s.months.includes(month)) ?? ALL_SEASONS[0];
};

// Component Thực Đơn Theo Mùa
const SeasonalMenuSection = () => {
  const [activeSeason, setActiveSeason] = useState(getCurrentSeason);
  const [hoveredDish, setHoveredDish]   = useState(null);
  const Icon = activeSeason.icon;

  return (
    <section className={`py-24 md:py-32 px-4 bg-gradient-to-b ${activeSeason.bg} transition-all duration-700`}>
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h4 className="font-display text-primary-500 font-bold tracking-[0.2em] mb-4">THEO NHỊP THIÊN NHIÊN</h4>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Thực Đơn Theo Mùa</h2>
          <p className="text-[#a89070] font-body text-lg max-w-xl mx-auto">
            Nguyên liệu theo mùa tươi nhất — chúng tôi biến chúng thành những tuyệt phẩm không bao giờ lặp lại.
          </p>
        </AnimatedSection>

        {/* Season Tabs */}
        <div className="flex justify-center gap-3 mb-14 flex-wrap">
          {ALL_SEASONS.map(s => {
            const SIcon = s.icon;
            const isActive = s.key === activeSeason.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSeason(s)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-300 ${
                  isActive
                    ? 'border-transparent text-[#0f0a05]'
                    : 'border-white/10 text-[#a89070] hover:border-white/30 hover:text-white bg-transparent'
                }`}
                style={ isActive ? { backgroundColor: s.accent, boxShadow: `0 0 24px ${s.accent}55` } : {} }
              >
                <SIcon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Current season badge */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ borderColor: activeSeason.accent + '44', backgroundColor: activeSeason.accent + '11' }}>
            <Icon className="w-4 h-4" style={{ color: activeSeason.accent }} />
            <span className="text-xs font-bold tracking-wider" style={{ color: activeSeason.accent }}>{activeSeason.tagline}</span>
          </div>
        </div>

        {/* 3 Dish Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {activeSeason.dishes.map((dish, idx) => {
            const isHov = hoveredDish === idx;
            const isOther = hoveredDish !== null && !isHov;
            return (
              <div
                key={dish.name}
                className={`relative overflow-hidden rounded-2xl cursor-pointer shadow-2xl transition-all duration-500 ${
                  isHov   ? 'scale-[1.03] ring-1 z-10' : ''
                } ${isOther ? 'opacity-40 blur-[1px] scale-[0.97]' : ''}`}
                style={ isHov ? { ringColor: activeSeason.accent, boxShadow: `0 0 40px ${activeSeason.accent}33` } : {} }
                onMouseEnter={() => setHoveredDish(idx)}
                onMouseLeave={() => setHoveredDish(null)}
              >
                {/* Ảnh */}
                <div className="aspect-[4/5] relative">
                  <img
                    src={dish.img}
                    alt={dish.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isHov ? 'scale-110' : 'scale-100'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a05] via-[#0f0a05]/30 to-transparent" />

                  {/* Số thứ tự */}
                  <div className="absolute top-4 left-4">
                    <span className="font-mono text-xs font-bold tracking-widest" style={{ color: activeSeason.accent + '99' }}>
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Nội dung */}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className={`font-display text-xl font-bold text-[#f5e6c8] leading-snug transition-all duration-300 ${isHov ? 'mb-3' : 'mb-0'}`}>
                      {dish.name}
                    </h3>
                    <div className={`overflow-hidden transition-all duration-500 ${isHov ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="font-body text-sm leading-relaxed mb-4" style={{ color: activeSeason.accent + 'bb' }}>
                        {dish.desc}
                      </p>
                      <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
                        style={{ color: activeSeason.accent }}
                      >
                        Đặt món ngay <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border font-bold text-sm transition-all duration-300 hover:scale-105"
            style={{ borderColor: activeSeason.accent + '60', color: activeSeason.accent, backgroundColor: activeSeason.accent + '10' }}
          >
            Xem toàn bộ thực đơn {activeSeason.label} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// Animated Section Wrapper

const AnimatedSection = ({ children, className = '' }) => {
  const [ref, isInView] = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [hoveredId, setHoveredId]     = useState(null);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setBestsellers([
          {
            _id: '1',
            name: 'Steak Bò Wagyu A5',
            description: 'Thịt bò Wagyu hạng A5 từ Nhật Bản, áp chảo vừa chín tới với bơ thảo mộc, kèm nấm truffle đen và sốt demi-glace hầm 12 tiếng.',
            image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop'
          },
          {
            _id: '2',
            name: 'Cá Hồi Na Uy Áp Chảo',
            description: 'Phi lê cá hồi Na Uy áp chảo da giòn, ăn kèm măng tây nướng, sốt chanh leo và dầu olive nguyên chất hạng nhất.',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop'
          },
          {
            _id: '3',
            name: 'Súp Nấm Truffle Đen',
            description: 'Súp kem nấm rừng phức hợp với lát truffle đen tươi nhập khẩu, rắc thêm parmesan bào và dầu truffle trắng Ý.',
            image: 'https://images.unsplash.com/photo-1548943487-a2e4b43b4859?q=80&w=800&auto=format&fit=crop'
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBestsellers();
  }, []);

  return (
    <div className="bg-[#0f0a05] text-[#f5e6c8]">
      {/* SECTION 1: HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop')",
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a05]/80 via-[#0f0a05]/60 to-[#0f0a05]" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20 animate-fade-in-up">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-wide drop-shadow-2xl">
            Hương vị nguyên bản <br/> từ <span className="text-[#d4a85a] italic">1990</span>
          </h1>
          <p className="font-body text-xl md:text-2xl text-[#a89070] mb-12 font-light">
            Nghệ thuật ẩm thực tinh tế giao thoa cùng không gian sang trọng, tạo nên trải nghiệm khó quên.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/menu" 
              className="px-10 py-4 bg-primary-500 text-white font-bold text-lg rounded-full shadow-xl shadow-primary-500/40 hover:bg-primary-600 hover:scale-105 transition-all duration-300 active:scale-95 tracking-wide flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Khám Phá Thực Đơn <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: OUR STORY */}
      <section className="py-24 md:py-32 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=1000&auto=format&fit=crop" 
                alt="Our Chef" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-[#d4a85a]/30 m-4 rounded-2xl pointer-events-none" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection>
            <h4 className="font-display text-primary-500 font-bold tracking-[0.2em] mb-4">CÂU CHUYỆN CỦA CHÚNG TÔI</h4>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              35 Năm Giữ Gìn <br/> Tinh Hoa Ẩm Thực
            </h2>
            <p className="font-body text-lg text-[#a89070] mb-8 leading-relaxed">
              Khởi nguồn từ một căn bếp nhỏ tĩnh lặng giữa lòng thành phố, chúng tôi đã dành hơn ba thập kỷ để hoàn thiện từng công thức. Mỗi món ăn là một tác phẩm nghệ thuật, là sự kết hợp hoàn hảo giữa nguyên liệu tươi sạch nhất và đôi bàn tay tài hoa của bếp trưởng.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <div className="text-4xl font-display font-bold text-[#d4a85a] mb-2">35+</div>
                <div className="text-sm font-bold tracking-widest text-[#a89070] uppercase">Năm Kinh Nghiệm</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold text-[#d4a85a] mb-2">100%</div>
                <div className="text-sm font-bold tracking-widest text-[#a89070] uppercase">Nguyên Liệu Hữu Cơ</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* SECTION 3: SIGNATURE MENU */}
      <section className="py-24 md:py-32 bg-[#1a1208] relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4a85a] via-[#1a1208] to-[#0f0a05]" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h4 className="font-display text-primary-500 font-bold tracking-[0.2em] mb-4">TINH HOA THỰC ĐƠN</h4>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Signature Dishes</h2>
            <p className="text-[#a89070] mt-4 font-body text-lg">Lướt qua từng tuyệt phẩm — để hương vị lên tiếng.</p>
          </AnimatedSection>

          {/* Spotlight Grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {bestsellers.map((item, index) => {
              const isHovered = hoveredId === item._id;
              const isOther   = hoveredId !== null && !isHovered;
              return (
                <div
                  key={item._id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                  onMouseEnter={() => setHoveredId(item._id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl cursor-pointer bg-stone-900 shadow-2xl
                      transition-all duration-500 ease-out
                      ${ isHovered ? 'aspect-[3/4] scale-[1.03] shadow-[0_0_60px_rgba(212,168,90,0.25)] z-10 ring-1 ring-[#d4a85a]/40' : 'aspect-[3/4]' }
                      ${ isOther  ? 'opacity-30 blur-[1.5px] scale-[0.97]' : '' }
                    `}
                  >
                    {/* Ảnh món */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${ isHovered ? 'scale-110' : 'scale-100' }`}
                    />

                    {/* Gradient overlay — đậm hơn khi hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#0f0a05] via-[#0f0a05]/40 to-transparent transition-opacity duration-500 ${ isHovered ? 'opacity-100' : 'opacity-70' }`} />

                    {/* Nội dung bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      {/* Tên món — luôn hiện */}
                      <h3 className={`font-display text-xl text-[#f5e6c8] font-bold leading-snug transition-all duration-300 ${ isHovered ? 'mb-3' : 'mb-0' }`}>
                        {item.name}
                      </h3>

                      {/* Mô tả + CTA — chỉ hiện khi hover */}
                      <div className={`overflow-hidden transition-all duration-500 ease-out ${ isHovered ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0' }`}>
                        <p className="font-body text-sm text-[#c4a87a] leading-relaxed mb-4">
                          {item.description}
                        </p>
                        <Link
                          to="/menu"
                          className="inline-flex text-sm font-bold text-[#d4a85a] uppercase tracking-wider items-center gap-2 hover:gap-3 transition-all duration-200"
                        >
                          Đặt món ngay <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Chỉ số góc trên - số thứ tự */}
                    <div className="absolute top-4 left-4">
                      <span className={`font-mono text-xs font-bold tracking-widest transition-opacity duration-300 ${ isHovered ? 'text-[#d4a85a] opacity-100' : 'text-[#a89070]/60 opacity-100' }`}>
                        0{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <AnimatedSection className="text-center">
            <Link
              to="/menu"
              className="inline-flex px-10 py-4 border-2 border-[#d4a85a]/60 text-[#d4a85a] font-bold text-lg rounded-full hover:border-[#d4a85a] hover:bg-[#d4a85a]/10 transition-all duration-300"
            >
              Xem Toàn Bộ Thực Đơn
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* SECTION 3.5: THỰC ĐƠN THEO MÙA */}
      <SeasonalMenuSection />

      {/* SECTION 4: SOCIAL PROOF & FOOTER */}
      <section className="py-24 md:py-32 px-4 max-w-7xl mx-auto border-b border-[#2d1f0a]">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <div className="flex justify-center gap-2 mb-8 text-[#d4a85a]">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-current" />)}
          </div>
          <p className="font-display text-2xl md:text-3xl text-white font-light italic leading-relaxed mb-8">
            "Không gian sang trọng, món ăn được trình bày như những tác phẩm nghệ thuật. Vị giác của tôi thực sự bùng nổ khi thử món Steak Wagyu tại đây. Chắc chắn sẽ quay lại!"
          </p>
          <div className="font-bold text-[#a89070] uppercase tracking-widest text-sm">
            — Đánh giá từ Trần Minh H.
          </div>
        </AnimatedSection>

        <AnimatedSection className="grid md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1208] border border-[#2d1f0a] flex items-center justify-center mb-6 text-[#d4a85a]">
              <Clock className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-xl text-white mb-2">Giờ Mở Cửa</h4>
            <p className="text-[#a89070]">Tất cả các ngày trong tuần</p>
            <p className="text-[#a89070] font-mono mt-1">10:00 AM - 11:00 PM</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1208] border border-[#2d1f0a] flex items-center justify-center mb-6 text-[#d4a85a]">
              <MapPin className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-xl text-white mb-2">Địa Chỉ</h4>
            <p className="text-[#a89070]">123 Nguyễn Văn Linh</p>
            <p className="text-[#a89070]">Quận 7, TP. Hồ Chí Minh</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1208] border border-[#2d1f0a] flex items-center justify-center mb-6 text-[#d4a85a]">
              <Phone className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-xl text-white mb-2">Liên Hệ</h4>
            <p className="text-[#a89070] font-mono">0909 123 456</p>
            <p className="text-[#a89070]">booking@restaurant.com</p>
          </div>
        </AnimatedSection>
      </section>

      <footer className="py-8 text-center bg-[#0a0703]">
        <p className="text-[#645038] text-sm">
          &copy; {new Date().getFullYear()} Restaurant. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
