import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { LogOut, LayoutDashboard, Utensils, Grid2X2, Users, FileBarChart, Menu as MenuIcon, Home, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard',   path: '/manager',         icon: LayoutDashboard },
    { name: 'Thực Đơn',   path: '/manager/menu',    icon: Utensils },
    { name: 'Quản Lý Bàn', path: '/manager/tables',  icon: Grid2X2 },
    { name: 'Nhân Viên',  path: '/manager/staff',   icon: Users },
    { name: 'Báo Cáo',    path: '/manager/reports', icon: FileBarChart },
  ];

  // Tiêu đề trang hiện tại
  const currentPage = navItems.find(item =>
    item.path === '/manager'
      ? location.pathname === '/manager'
      : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentPage?.name ?? 'Quản Lý';

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] font-sans selection:bg-primary-500 selection:text-white flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-auto`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-[#1e293b] px-4">
          <Link to="/" className="group flex items-center gap-2">
            <span className="font-admin font-bold text-xl tracking-wide text-white group-hover:text-primary-400 transition-colors">
              RESTAURANT<span className="text-primary-500">.</span>
            </span>
          </Link>
        </div>
        {/* Nav Items */}
        <div className="px-4 py-4 space-y-1">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3 px-3">Quản trị viên</p>
          {/* Nút quay về trang chủ khách */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#64748b] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-all duration-200 mb-4 border border-[#1e293b]"
          >
            <Home className="w-4 h-4" />
            <span className="font-medium text-xs">Về trang chủ</span>
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/manager'
              ? location.pathname === '/manager'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
        <div className="absolute bottom-0 w-full p-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-primary-500 font-bold">
               M
             </div>
             <div>
               <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
               <p className="text-xs text-[#64748b]">Quản lý</p>
             </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header Bar */}
          <div className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-[#e2e8f0] shrink-0">
            <div className="flex items-center gap-3">
              {location.pathname !== '/manager' && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-lg font-bold text-slate-900 font-admin">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-500 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Trang chủ
              </Link>
              <div className="w-px h-5 bg-slate-200" />
              <span className="text-sm text-slate-500">{user?.name}</span>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-[#e2e8f0]">
            <span className="font-admin font-bold text-lg">RESTAURANT.</span>
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-[#64748b]">
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManagerLayout;
