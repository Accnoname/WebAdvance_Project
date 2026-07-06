import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { LogOut, User as UserIcon, Menu as MenuIcon, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getTotalItems, getTotalAmount } = useCartStore();
  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled || !isLandingPage
        ? 'bg-[#0f0a05]/90 backdrop-blur-md border-b border-[#2d1f0a] py-3 shadow-xl' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center transition-transform duration-700 group-hover:rotate-[360deg]">
                <svg className="w-10 h-10 text-[#d4a85a]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45" stroke="#d4a85a" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="39" stroke="#d4a85a" strokeWidth="1" />
                  <path d="M38 30H53C61 30 65 33.5 65 39C65 44 61.5 47 55 47.5L66 70H57L47 50H44V70H38V30ZM44 44.5H52.5C57.5 44.5 59.5 43 59.5 39C59.5 35 57.5 35.5 52.5 35.5H44V44.5Z" fill="#d4a85a" />
                </svg>
              </div>
              <div className="flex flex-col text-left leading-none hidden sm:flex">
                <span className="font-display font-black text-lg text-[#d4a85a] tracking-[0.2em] uppercase">
                  L'ARÔME
                </span>
                <span className="text-[8px] font-mono font-bold text-stone-500 tracking-[0.3em] uppercase mt-1">
                  EST. 1990
                </span>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/menu" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-[#a89070] hover:text-[#d4a85a] transition-colors uppercase tracking-[0.15em]">
                Thực đơn
              </Link>
              <Link to="/reservation" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-[#a89070] hover:text-[#d4a85a] transition-colors uppercase tracking-[0.15em]">
                Đặt bàn
              </Link>
              {user && user.role === 'khach_hang' && (
                <Link to="/my-orders" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-[#a89070] hover:text-[#d4a85a] transition-colors uppercase tracking-[0.15em]">
                  Lịch sử đặt món
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-6">
            <Link to="/cart" className="relative flex items-center gap-2 text-[#a89070] hover:text-[#d4a85a] transition-colors group">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg border-2 border-[#0f0a05] group-hover:scale-110 transition-transform">
                    {totalItems}
                  </span>
                )}
              </div>
              {totalAmount > 0 && (
                <span className="font-bold text-sm bg-[#1a1208]/80 px-3 py-1.5 rounded-full border border-[#2d1f0a]">
                  {totalAmount.toLocaleString('vi-VN')}đ
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/settings" className="flex items-center gap-2 px-4 py-2 bg-[#1a1208]/80 hover:bg-[#2d1f0a]/50 rounded-full border border-[#2d1f0a] transition-all hover:border-[#d4a85a]/40 group/user">
                  <UserIcon className="w-4 h-4 text-[#d4a85a] group-hover/user:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-[#f5e6c8]">{user.name}</span>
                </Link>
                {user.role === 'quan_ly' && (
                  <Link to="/manager" className="text-sm font-bold text-primary-500 hover:text-primary-400">
                    Dashboard
                  </Link>
                )}
                {user.role === 'nhan_vien' && (
                  <Link to="/staff" className="text-sm font-bold text-primary-500 hover:text-primary-400">
                    Staff Portal
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl transition-all relative group flex items-center justify-center"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="absolute top-12 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#251b0f] text-rose-400 border border-rose-900/30 text-[10px] font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none">
                    Đăng xuất
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-bold text-[#f5e6c8] hover:text-[#d4a85a] transition-colors uppercase tracking-wider"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-full transition-all shadow-lg shadow-primary-500/20 active:scale-95 uppercase tracking-wider"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-[#a89070] hover:text-[#f5e6c8] focus:outline-none"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#2d1f0a] bg-[#0f0a05] absolute w-full left-0 shadow-2xl">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/menu" className="block pl-4 pr-4 py-3 text-base font-bold text-[#a89070] hover:bg-[#1a1208] hover:text-[#d4a85a]">
              Thực đơn
            </Link>
            <Link to="/reservation" className="block pl-4 pr-4 py-3 text-base font-bold text-[#a89070] hover:bg-[#1a1208] hover:text-[#d4a85a]">
              Đặt bàn
            </Link>
            <Link to="/cart" className="block pl-4 pr-4 py-3 text-base font-bold text-[#a89070] hover:bg-[#1a1208] hover:text-[#d4a85a] flex justify-between items-center">
              <span>Giỏ hàng</span>
              {totalItems > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalItems} món ({totalAmount.toLocaleString('vi-VN')}đ)
                </span>
              )}
            </Link>
            {user && user.role === 'khach_hang' && (
              <Link to="/my-orders" className="block pl-4 pr-4 py-3 text-base font-bold text-[#a89070] hover:bg-[#1a1208] hover:text-[#d4a85a]">
                Lịch sử đặt món
              </Link>
            )}
          </div>
          <div className="pt-4 pb-4 border-t border-[#2d1f0a]">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#1a1208] border border-[#2d1f0a] flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-[#d4a85a]" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-bold text-[#f5e6c8]">{user.name}</div>
                    <div className="text-sm font-medium text-[#a89070]">{user.email}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left pl-4 pr-4 py-3 text-base font-bold text-[#a89070] hover:bg-[#1a1208] hover:text-[#d4a85a]"
                  >
                    Cài đặt tài khoản
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left pl-4 pr-4 py-3 text-base font-bold text-rose-400 hover:bg-[#1a1208]"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 px-4">
                <Link to="/login" className="block text-center w-full px-4 py-3 text-base font-bold text-[#f5e6c8] bg-[#1a1208] rounded-full border border-[#2d1f0a]">
                  Đăng nhập
                </Link>
                <Link to="/register" className="block text-center w-full px-4 py-3 text-base font-bold text-white bg-primary-500 rounded-full">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
