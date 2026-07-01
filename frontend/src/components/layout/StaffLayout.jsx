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
    <div className="min-h-screen bg-[#0d1117] text-white font-staff selection:bg-amber-500 selection:text-stone-900 flex flex-col">
      <nav className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/staff" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-stone-900 font-black text-lg">
                  S
                </div>
                <span className="font-bold text-xl tracking-wide hidden sm:block">STAFF PORTAL</span>
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
                        ${isActive ? 'bg-amber-500/10 text-amber-500' : 'text-stone-400 hover:text-white hover:bg-[#21262d]'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-stone-400 font-bold bg-[#21262d] px-3 py-1.5 rounded-lg border border-[#30363d]">
                {user?.name}
              </div>
              <button
                onClick={logout}
                className="p-2 text-stone-400 hover:text-rose-500 transition-colors bg-[#21262d] rounded-lg border border-[#30363d] hover:border-rose-500/30 hover:bg-rose-500/10"
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
