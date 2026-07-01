import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, Clock, LayoutGrid, ClipboardList, Utensils,
  ChevronRight, AlertTriangle, CheckCircle, Bell, X,
  Timer, RotateCcw, Ban, Target, ChefHat, Calendar, ChevronDown,
  RefreshCw, Loader2, CheckCircle2, CalendarClock, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { TableService } from '../../services/table.service';

// ─── MOCK DATA ────────────────────────────────────────────────
const revenueByRange = {
  today:   [
    { label: '10:00', amount: 1200000 }, { label: '12:00', amount: 4500000 },
    { label: '14:00', amount: 3200000 }, { label: '16:00', amount: 2100000 },
    { label: '18:00', amount: 6800000 }, { label: '20:00', amount: 8900000 },
    { label: '22:00', amount: 4100000 },
  ],
  week:    [
    { label: 'T2', amount: 28000000 }, { label: 'T3', amount: 32000000 },
    { label: 'T4', amount: 25000000 }, { label: 'T5', amount: 41000000 },
    { label: 'T6', amount: 55000000 }, { label: 'T7', amount: 62000000 },
    { label: 'CN', amount: 48000000 },
  ],
  month:   [
    { label: 'T1', amount: 180000000 }, { label: 'T2', amount: 210000000 },
    { label: 'T3', amount: 195000000 }, { label: 'T4', amount: 230000000 },
  ],
  quarter: [
    { label: 'Q1', amount: 580000000 }, { label: 'Q2', amount: 640000000 },
    { label: 'Q3', amount: 720000000 }, { label: 'Q4', amount: 810000000 },
  ],
  year:    [
    { label: '2022', amount: 1800000000 }, { label: '2023', amount: 2200000000 },
    { label: '2024', amount: 2750000000 },
  ],
};

const topItems = [
  { name: 'Steak Bò Wagyu', sold: 45 },
  { name: 'Cá Hồi Áp Chảo', sold: 38 },
  { name: 'Salad Cá Ngừ',   sold: 32 },
  { name: 'Súp Truffle',     sold: 28 },
];

const activeOrders = [
  { id: '#1042', table: 'Bàn 05', time: '12 mins', status: 'dang_nau', amount: 1450000 },
  { id: '#1043', table: 'Bàn 12', time: '5 mins',  status: 'cho_nau',  amount:  890000 },
  { id: '#1044', table: 'Bàn 02', time: '2 mins',  status: 'cho_nau',  amount:  450000 },
  { id: '#1045', table: 'Bàn 08', time: '18 mins', status: 'xong',     amount: 2100000 },
];

// tableStatusData đã được xóa — dùng API thực

const INITIAL_ALERTS = [
  { id: 1, level: 'critical', icon: Timer,   title: 'Bếp chậm — Ticket quá lâu', desc: 'Bàn 05: Steak Wagyu chờ 22 phút chưa xong', time: '2 phút trước' },
  { id: 2, level: 'warning',  icon: Ban,     title: 'Đơn hủy bất thường',         desc: '2 đơn bị hủy trong vòng 1 giờ qua',         time: '15 phút trước' },
  { id: 3, level: 'warning',  icon: Users,   title: 'Bàn chưa được phục vụ',      desc: 'Bàn 09: khách ngồi đã 8 phút, chưa ai đến', time: '5 phút trước' },
  { id: 4, level: 'info',     icon: ChefHat, title: 'Sắp hết nguyên liệu',        desc: 'Cá Hồi Na Uy: nhân viên bếp báo sắp hết',   time: '20 phút trước' },
];

const DATE_RANGE_OPTIONS = [
  { key: 'today',   label: 'Hôm nay'  },
  { key: 'week',    label: 'Tuần này' },
  { key: 'month',   label: 'Tháng'    },
  { key: 'quarter', label: 'Quý'      },
  { key: 'year',    label: 'Năm'      },
  { key: 'custom',  label: 'Tùy chỉnh' },
];

// Sinh mock data theo khoảng ngày tùy chỉnh
const generateCustomData = (from, to) => {
  if (!from || !to) return [];
  const result = [];
  const start = new Date(from);
  const end   = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    result.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      amount: Math.floor(Math.random() * 15000000) + 5000000,
    });
  }
  return result;
};

// Tính tổng / đếm từ chart data
const computeStats = (data) => {
  const total   = data.reduce((s, d) => s + d.amount, 0);
  const orders  = data.reduce((s, d) => s + Math.floor(d.amount / 243000), 0);
  const aov     = orders > 0 ? Math.round(total / orders) : 0;
  return { total, orders, aov };
};

// ─── SUB COMPONENTS ───────────────────────────────────────────
const KPICard = ({ title, value, subtitle, icon: Icon, trend, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${
          trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'
        }`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">{value}</div>
    <div className="text-sm font-medium text-slate-500 mt-1 font-sans">{title}</div>
    {subtitle && <div className="text-xs text-slate-400 mt-1 font-sans">{subtitle}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    cho_nau:  { style: 'bg-rose-50 text-rose-700 border-rose-200',          label: 'Chờ nấu'   },
    dang_nau: { style: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Đang nấu'  },
    xong:     { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Sẵn sàng'  },
  };
  const s = map[status] ?? { style: '', label: status };
  return <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${s.style}`}>{s.label}</span>;
};

const AlertItem = ({ alert, onDismiss }) => {
  const levelStyle = {
    critical: 'border-rose-200 bg-rose-50',
    warning:  'border-amber-200 bg-amber-50',
    info:     'border-blue-200 bg-blue-50',
  };
  const iconStyle = {
    critical: 'text-rose-600',
    warning:  'text-amber-600',
    info:     'text-blue-600',
  };
  const Icon = alert.icon;
  return (
    <div className={`flex gap-3 p-3.5 rounded-xl border ${levelStyle[alert.level]}`}>
      <div className={`mt-0.5 shrink-0 ${iconStyle[alert.level]}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm leading-snug">{alert.title}</p>
        <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{alert.desc}</p>
        <p className="text-slate-400 text-[11px] mt-1">{alert.time}</p>
      </div>
      <button onClick={() => onDismiss(alert.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors mt-0.5" aria-label="Đã xử lý">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────
const DashboardPage = () => {
  useDocumentTitle('Dashboard Quản Lý');
  const today = new Date().toISOString().split('T')[0];

  const [dateRange, setDateRange]           = useState('today');
  const [customFrom, setCustomFrom]         = useState(today);
  const [customTo, setCustomTo]             = useState(today);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [alerts, setAlerts]                 = useState(INITIAL_ALERTS);
  const [showAlertPanel, setShowAlertPanel] = useState(true);

  // ── Table View State (view-only) ──
  const [tables, setTables]               = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);

  const TABLE_STATUS_CONFIG = {
    trong:        { label: 'Bàn trống',    dotColor: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    dang_phuc_vu: { label: 'Đang phục vụ', dotColor: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',         icon: Utensils },
    dat_truoc:    { label: 'Đã đặt trước',  dotColor: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',       icon: CalendarClock },
    dong:         { label: 'Đóng cửa',     dotColor: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 border-slate-200',      icon: Ban },
  };

  const fetchTables = useCallback(async () => {
    try {
      setTablesLoading(true);
      const res = await TableService.getAll();
      if (res.success) setTables(res.data.sort((a, b) => a.tableNumber - b.tableNumber));
    } catch {
      // silent fail
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const dismissAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  // Quyết định data biểu đồ theo mode
  const chartData = useMemo(() => {
    if (dateRange === 'custom') return generateCustomData(customFrom, customTo);
    return revenueByRange[dateRange] ?? [];
  }, [dateRange, customFrom, customTo]);

  // Tính KPI dựa trên chartData hiện tại
  const stats = useMemo(() => computeStats(chartData), [chartData]);

  // Label hiển thị cho header
  const periodLabel = useMemo(() => {
    if (dateRange === 'custom' && customFrom && customTo)
      return `${customFrom.split('-').reverse().join('/')} → ${customTo.split('-').reverse().join('/')}`;
    return DATE_RANGE_OPTIONS.find(o => o.key === dateRange)?.label ?? '';
  }, [dateRange, customFrom, customTo]);

  const handleRangeTab = (key) => {
    setDateRange(key);
    if (key === 'custom') setShowCustomPicker(true);
    else setShowCustomPicker(false);
  };

  const formatTick = (value) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(0)}M`;
    return `${(value / 1_000).toFixed(0)}K`;
  };

  const fmtMoney = (v) => v.toLocaleString('vi-VN') + 'đ';
  const fmtNum   = (v) => v.toLocaleString('vi-VN');

  return (
    <div className="flex gap-6 p-8 max-w-[1600px] mx-auto min-h-full">

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-8 animate-fade-in-up">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-admin tracking-tight">Tổng Quan Trạng Thái</h1>
            <p className="text-slate-500 mt-1 font-sans text-sm">Dữ liệu được cập nhật theo thời gian thực</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAlertPanel(p => !p)}
              className="relative p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-sans">Hôm nay</div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE TARGET PROGRESS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-slate-800 font-admin">Mục Tiêu Doanh Thu Hôm Nay</span>
            </div>
            <span className="font-mono font-black text-slate-900 text-lg">34.500.000đ / 50.000.000đ</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-orange-400 relative" style={{ width: '69%' }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2 font-sans">
            <span className="font-bold text-primary-600">Đạt 69%</span>
            <span>Còn thiếu: 15.500.000đ</span>
          </div>
        </div>

        {/* KPI GRID — giờ hiển thị số liệu tính từ chartData */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard title="Tổng Doanh Thu" value={fmtMoney(stats.total)} trend={5.2}  icon={DollarSign}  colorClass="bg-emerald-100 text-emerald-600" />
          <KPICard title="Tổng Số Đơn"    value={fmtNum(stats.orders)}  trend={8.1}  icon={ShoppingBag} colorClass="bg-blue-100 text-blue-600" />
          <KPICard title="Giá Trị TB / Đơn (AOV)" value={fmtMoney(stats.aov)} trend={3.2}  icon={Target}      colorClass="bg-purple-100 text-purple-600" />
          <KPICard title="Vòng Quay Bàn"   value="3.2 lần"  trend={-1.4} icon={RotateCcw}   colorClass="bg-cyan-100 text-cyan-600" subtitle="Trung bình mỗi bàn" />
          <KPICard title="Bàn Đang Bận"   value="18 / 25"  icon={Users}                    colorClass="bg-indigo-100 text-indigo-600" subtitle="Lấp đầy 72%" />
          <KPICard title="Đơn Chờ Bếp"    value="12"       trend={-2.1} icon={Clock}       colorClass="bg-orange-100 text-orange-600" subtitle="2 đơn chờ quá 15 phút" />
          <KPICard title="Tỷ Lệ Đơn Hủy"  value="2.8%"     trend={1.2}  icon={Ban}         colorClass="bg-rose-100 text-rose-600" subtitle="4 đơn bị hủy" />
          <KPICard title="TG Chế Biến TB"  value="14 phút"  trend={-5.0} icon={Timer}       colorClass="bg-teal-100 text-teal-600" subtitle="Từ lúc đặt → món lên bàn" />
        </div>

        {/* REALTIME STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Orders Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h2 className="text-lg font-bold text-slate-900 font-admin">Đơn Đang Xử Lý</h2>
              <Link to="/manager/reports" className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Mã Đơn</th>
                    <th className="px-6 py-4 font-medium">Bàn</th>
                    <th className="px-6 py-4 font-medium">Thời gian</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">{order.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{order.table}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {order.time}</span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        {order.amount.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Status Widget — View Only */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 font-admin">Sơ Đồ Bàn</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTables}
                    disabled={tablesLoading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Làm mới"
                  >
                    <RefreshCw className={`w-4 h-4 ${tablesLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <Link
                    to="/manager/tables?editMode=true"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Chỉnh sửa
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px]">
              {tablesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {tables.map((table) => {
                    const cfg = TABLE_STATUS_CONFIG[table.status];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={table._id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-black ${cfg.badge}`}>
                            {table.tableNumber}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">Bàn {table.tableNumber}</div>
                            <div className="text-xs text-slate-400">{table.capacity} khách</div>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border ${cfg.badge}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap gap-x-4 gap-y-1.5">
              {Object.entries(TABLE_STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                  {cfg.label}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div>
          <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Lối Tắt Quản Trị</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: '/manager/menu',    Icon: Utensils,      label: 'Quản Lý Menu' },
              { to: '/manager/tables',  Icon: LayoutGrid,    label: 'Quản Lý Bàn' },
              { to: '/manager/staff',   Icon: Users,         label: 'Nhân Sự' },
              { to: '/manager/reports', Icon: ClipboardList, label: 'Báo Cáo' },
            ].map(({ to, Icon, label }) => (
              <Link key={to} to={to} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl hover:border-primary-400 hover:shadow-md transition-all group">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors text-slate-600">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* CHARTS + DATE RANGE FILTER */}
        <div className="space-y-4">
          {/* Bộ lọc thời gian */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Phân Tích Doanh Thu</h3>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tabs nhanh */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {DATE_RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleRangeTab(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      dateRange === opt.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.key === 'custom' && <Calendar className="w-3.5 h-3.5" />}
                    {opt.label}
                    {opt.key === 'custom' && <ChevronDown className="w-3 h-3" />}
                  </button>
                ))}
              </div>

              {/* Custom date range picker — hiện khi chọn Tùy chỉnh */}
              {showCustomPicker && (
                <div className="flex items-center gap-2 bg-white border border-primary-300 rounded-xl px-4 py-2 shadow-sm animate-fade-in-up">
                  <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer"
                  />
                  <span className="text-slate-400 text-sm font-bold">→</span>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    onChange={e => setCustomTo(e.target.value)}
                    className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Label kết quả */}
          {chartData.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Kết quả cho giai đoạn: <span className="text-primary-500 normal-case">{periodLabel}</span></p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-slate-500">Tổng doanh thu</p>
                    <p className="text-2xl font-black font-mono text-slate-900">{fmtMoney(stats.total)}</p>
                  </div>
                  <div className="border-l border-slate-200 pl-8">
                    <p className="text-xs text-slate-500">Số đơn hàng</p>
                    <p className="text-2xl font-black font-mono text-slate-900">{fmtNum(stats.orders)} đơn</p>
                  </div>
                  <div className="border-l border-slate-200 pl-8">
                    <p className="text-xs text-slate-500">Giá trị TB / đơn</p>
                    <p className="text-2xl font-black font-mono text-slate-900">{fmtMoney(stats.aov)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 font-admin mb-6">Doanh Thu Theo Thời Gian</h2>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatTick} dx={-8} />
                    <RechartsTooltip
                      formatter={(v) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 font-admin mb-6">Top Món Bán Chạy</h2>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 16, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(v) => [`${v} phần`, 'Đã bán']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sold" fill="#10b981" radius={[0, 6, 6, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── ALERT PANEL (Right sidebar) ────────────────── */}
      {showAlertPanel && (
        <div className="w-80 shrink-0 animate-fade-in-up">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-slate-900 font-admin">Cảnh Báo Vận Hành</h2>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                alerts.length > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {alerts.length}
              </span>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                  <p className="font-medium text-sm">Không có cảnh báo nào</p>
                  <p className="text-xs mt-1">Mọi thứ đang hoạt động tốt!</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} onDismiss={dismissAlert} />
                ))
              )}
            </div>

            {alerts.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/60">
                <button
                  onClick={() => setAlerts([])}
                  className="w-full py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Đánh dấu tất cả đã xử lý
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
