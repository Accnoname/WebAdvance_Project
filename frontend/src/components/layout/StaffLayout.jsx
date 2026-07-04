import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import { LogOut, LayoutDashboard, UtensilsCrossed, MonitorPlay, LayoutGrid, BellRing } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const socket = useSocket('staff');

  useEffect(() => {
    if (!socket) return;
    
    socket.on('staff:called', (data) => {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-amber-500 p-4`}
        >
          <div className="flex items-start gap-4 w-full">
            <div className="flex-shrink-0 bg-amber-100 p-3 rounded-full">
              <BellRing className="w-6 h-6 text-amber-600 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-900 mb-1">Bàn {data.tableNumber} Đang Gọi!</p>
              <p className="text-sm text-stone-600">{data.reason}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-colors"
            >
              Đã nhận
            </button>
          </div>
        </div>
      ), { duration: 15000 }); // Hiển thị 15 giây
    });

    return () => {
      socket.off('staff:called');
    };
  }, [socket]);

  const navItems = [
    { name: 'Dashboard',     path: '/staff/dashboard', icon: LayoutGrid },
    { name: 'Màn Hình Bếp', path: '/staff/kitchen',   icon: MonitorPlay },
    { name: 'Sơ Đồ Bàn',   path: '/staff/tables',    icon: LayoutDashboard },
    { name: 'Điều Phối Đơn', path: '/staff/orders',  icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-staff selection:bg-primary-500 selection:text-white flex flex-col">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/staff" className="flex items-center gap-3 group">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                  S
                </div>
                <span className="font-black text-xl tracking-tighter hidden sm:block text-stone-800">STAFF PORTAL</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200
                        ${isActive 
                          ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-500/10' 
                          : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : ''}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-stone-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-stone-200/60">
                {user?.name}
              </div>
              <button
                onClick={logout}
                className="p-2 text-stone-500 hover:text-rose-600 transition-colors bg-white rounded-xl shadow-sm border border-stone-200/60 hover:border-rose-200 hover:bg-rose-50"
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
