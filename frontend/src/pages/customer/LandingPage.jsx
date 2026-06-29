import { Link } from 'react-router-dom';
import useInView from '../../hooks/useInView';
import { ArrowRight, Star, Clock, MapPin, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    // Fetch top 3 signature items
    const fetchBestsellers = async () => {
      try {
        // We'll mock this for now, but ideally it calls an API
        // const res = await axios.get('http://localhost:5000/api/menu?limit=3');
        // setBestsellers(res.data.data);
        
        // Mock data
        setBestsellers([
          { _id: '1', name: 'Steak Bò Wagyu A5', price: 1250000, image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?q=80&w=800&auto=format&fit=crop' },
          { _id: '2', name: 'Cá Hồi Na Uy Áp Chảo', price: 450000, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop' },
          { _id: '3', name: 'Súp Nấm Truffle Đen', price: 280000, image: 'https://images.unsplash.com/photo-1548943487-a2e4b43b4859?q=80&w=800&auto=format&fit=crop' },
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
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {bestsellers.map((item, index) => (
              <div 
                key={item._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
              >
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4] bg-stone-900 shadow-2xl">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a05]/95 via-[#0f0a05]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-0 p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-display text-2xl text-[#f5e6c8] font-bold mb-2">{item.name}</h3>
                    <p className="text-[#d4a85a] font-mono font-bold text-lg mb-4">{item.price.toLocaleString('vi-VN')}đ</p>
                    <Link 
                      to="/menu"
                      className="inline-flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-bold text-primary-500 uppercase tracking-wider items-center gap-2"
                    >
                      Đặt món ngay <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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
