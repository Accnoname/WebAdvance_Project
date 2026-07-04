import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { LogOut, LayoutDashboard, UtensilsCrossed, MonitorPlay, LayoutGrid } from 'lucide-react';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard',     path: '/staff/dashboard', icon: LayoutGrid },
    { name: 'Màn Hình Bếp', path: '/staff/kitchen',   icon: MonitorPlay },
    { name: 'Sơ Đồ Bàn',   path: '/staff/tables',    icon: LayoutDashboard },
    { name: 'Điều Phối Đơn', path: '/staff/orders',  icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-staff selection:bg-primary-500 selection:text-white flex flex-col">
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/staff" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
                  S
                </div>
                <span className="font-bold text-xl tracking-wide hidden sm:block text-stone-800">STAFF PORTAL</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200
                        ${isActive ? 'bg-primary-50 text-primary-700' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-stone-600 font-bold bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                {user?.name}
              </div>
              <button
                onClick={logout}
                className="p-2 text-stone-500 hover:text-rose-600 transition-colors bg-stone-100 rounded-lg border border-stone-200 hover:border-rose-200 hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Nav */}
      <div className="sm:hidden flex bg-[#161b22] border-b border-[#30363d] overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 min-w-[120px] flex justify-center items-center gap-2 px-2 py-3 font-bold text-sm border-b-2 transition-all duration-200
                ${isActive ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-stone-400 hover:text-white hover:bg-[#21262d]'}`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;
