import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { LogOut, User as UserIcon, Menu as MenuIcon } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-display font-bold text-xl">
                R
              </div>
              <span className="font-display font-bold text-2xl text-stone-900 tracking-tight hidden sm:block">
                Restaurant
              </span>
            </Link>
            {/* Desktop Menu */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link to="/menu" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-stone-700 hover:text-primary-600 transition-colors">
                Thực đơn
              </Link>
              {user && (
                <Link to="/my-orders" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-stone-700 hover:text-primary-600 transition-colors">
                  Đơn hàng của tôi
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center sm:gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
                  <UserIcon className="w-4 h-4 text-stone-500" />
                  <span className="text-sm font-medium text-stone-700">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-medium text-stone-700 hover:text-primary-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-sm shadow-primary-500/20 active:scale-95"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-stone-400 hover:text-stone-500 hover:bg-stone-100 focus:outline-none"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-stone-200 bg-white absolute w-full left-0">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/menu" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300">
              Thực đơn
            </Link>
            {user && (
              <Link to="/my-orders" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300">
                Đơn hàng của tôi
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-stone-200">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-stone-800">{user.name}</div>
                    <div className="text-sm font-medium text-stone-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={logout}
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-4">
                <Link to="/login" className="block text-center w-full px-4 py-2 text-base font-medium text-stone-700 bg-stone-100 rounded-xl">
                  Đăng nhập
                </Link>
                <Link to="/register" className="block text-center w-full px-4 py-2 text-base font-medium text-white bg-primary-600 rounded-xl">
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
