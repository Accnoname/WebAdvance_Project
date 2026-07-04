import { useState, useEffect } from 'react';
import { TableService } from '../../services/table.service';
import {
  Loader2, Utensils, CalendarClock, Ban, CheckCircle2,
  LayoutGrid, Clock, Users, RefreshCw, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  trong:        { label: 'Bàn trống',    color: 'bg-emerald-500', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2 },
  dang_phuc_vu: { label: 'Đang phục vụ', color: 'bg-rose-500',    ring: 'ring-rose-500/30',    bg: 'bg-rose-500/10 border-rose-500/30',        text: 'text-rose-400',    icon: Utensils },
  dat_truoc:    { label: 'Đã đặt trước', color: 'bg-amber-500',   ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10 border-amber-500/30',       text: 'text-amber-400',   icon: CalendarClock },
  dong:         { label: 'Đóng cửa',    color: 'bg-stone-500',   ring: 'ring-stone-500/30',   bg: 'bg-stone-500/10 border-stone-500/30',       text: 'text-stone-400',   icon: Ban },
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await TableService.getAll();
      if (response.success) {
        setTables(response.data.sort((a, b) => a.tableNumber - b.tableNumber));
      }
    } catch {
      toast.error('Không thể tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const stats = {
    total:    tables.length,
    trong:    tables.filter(t => t.status === 'trong').length,
    serving:  tables.filter(t => t.status === 'dang_phuc_vu').length,
    reserved: tables.filter(t => t.status === 'dat_truoc').length,
    closed:   tables.filter(t => t.status === 'dong').length,
  };

  const filteredTables = filterStatus === 'all'
    ? tables
    : tables.filter(t => t.status === filterStatus);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-full p-4 sm:p-6 space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Xin chào, <span className="text-primary-600">{user?.name}</span> 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {dateStr} — {timeStr}
          </p>
        </div>
        <button
          onClick={fetchTables}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl font-bold text-sm transition-all duration-200 hover:border-primary-500/40 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số bàn',  value: stats.total,    icon: LayoutGrid,    color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30' },
          { label: 'Đang phục vụ', value: stats.serving,  icon: Utensils,      color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30' },
          { label: 'Bàn trống',    value: stats.trong,    icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
          { label: 'Đã đặt trước', value: stats.reserved, icon: CalendarClock, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`flex items-center gap-4 p-4 rounded-2xl border ${card.bg} transition-all duration-200 shadow-sm bg-white`}>
              <div className={`p-2.5 rounded-xl bg-stone-50 border border-stone-100 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                <div className="text-xs text-stone-600 font-medium mt-0.5">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table View Section — View Only */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-5 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl">
              <LayoutGrid className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-lg">Sơ Đồ Bàn</h2>
              <p className="text-stone-500 text-xs">Xem nhanh trạng thái bàn hiện tại</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all',          label: `Tất cả (${stats.total})` },
                { key: 'trong',        label: `Trống (${stats.trong})` },
                { key: 'dang_phuc_vu', label: `Phục vụ (${stats.serving})` },
                { key: 'dat_truoc',    label: `Đặt trước (${stats.reserved})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border
                    ${filterStatus === f.key
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Redirect to TablesPage with editMode */}
            <Link
              to="/staff/tables?editMode=true"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white text-stone-600 hover:text-primary-600 hover:border-primary-500/40 transition-all whitespace-nowrap shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Chỉnh sửa
            </Link>
          </div>
        </div>

        {/* Tables Grid — View Only */}
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16 text-stone-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Không có bàn nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredTables.map((table) => {
                const config = STATUS_CONFIG[table.status];
                const Icon = config.icon;
                return (
                  <div
                    key={table._id}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border ${config.bg} bg-white shadow-sm`}
                  >
                    <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mb-3 shadow-sm">
                      <span className="text-xl font-black text-stone-900">{table.tableNumber}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 mb-1 ${config.text}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-bold text-xs">{config.label}</span>
                    </div>
                    <div className="text-stone-500 text-xs">{table.capacity} khách</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-5 pb-5 flex flex-wrap gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
              <span className="text-xs text-stone-500 font-medium">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
