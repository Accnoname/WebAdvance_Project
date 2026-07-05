import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TableService } from '../../services/table.service';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';
import {
  Loader2, QrCode, Utensils, CalendarClock, Ban, CheckCircle2,
  ListChecks, CheckSquare, RefreshCw, Plus, LayoutGrid,
  Users, Clock, MapPin, Sparkles, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

// Parse ghi chú đặt bàn để lấy khu vực & yêu cầu đặc biệt
const parseReservationNote = (note = '') => {
  const parts = note.split(' | ');
  let area = null;
  let specialRequests = [];
  let extraNote = '';
  parts.forEach(part => {
    if (part.startsWith('Khu vực: ')) area = part.replace('Khu vực: ', '');
    else if (part.startsWith('Yêu cầu đặc biệt: ')) specialRequests = part.replace('Yêu cầu đặc biệt: ', '').split(', ');
    else if (part) extraNote = part;
  });
  return { area, specialRequests, extraNote };
};

const STATUS_CONFIG = {
  trong:        { label: 'Bàn trống',    dotColor: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  dang_phuc_vu: { label: 'Đang phục vụ', dotColor: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',          icon: Utensils },
  dat_truoc:    { label: 'Đã đặt trước', dotColor: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',        icon: CalendarClock },
  dong:         { label: 'Đóng cửa',     dotColor: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200',       icon: Ban },
};

const AREA_LABELS = {
  window: 'Khu cửa sổ',
  garden: 'Sân vườn',
  vip: 'Phòng VIP',
  main: 'Khu chính'
};

const TableManagePage = () => {
  useDocumentTitle('Quản Lý Bàn');
  const [searchParams, setSearchParams] = useSearchParams();

  const [tables, setTables]             = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(null);
  const [selectedQR, setSelectedQR]     = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData]     = useState({ tableNumber: '', capacity: 4, area: 'main' });
  const [isCreating, setIsCreating]     = useState(false);
  const [deletingId, setDeletingId]     = useState(null);

  const [isEditMode, setIsEditMode]     = useState(searchParams.get('editMode') === 'true');
  const [selectedIds, setSelectedIds]   = useState([]);
  const [bulkStatus, setBulkStatus]     = useState('trong');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTables(), fetchOrders(), fetchReservations()]);
      setLoading(false);
    };
    init();
    if (searchParams.get('editMode') === 'true') {
      setSearchParams({}, { replace: true });
    }
  }, []);

  const fetchTables = async () => {
    try {
      const res = await TableService.getAll();
      if (res.success) setTables(res.data.sort((a, b) => a.tableNumber - b.tableNumber));
    } catch { toast.error('Không thể tải danh sách bàn'); }
  };

  const fetchOrders = async () => {
    try {
      const res = await OrderService.getAll({ orderStatus: 'dang_xu_ly' });
      if (res.success) setActiveOrders(res.data);
    } catch {}
  };

  const fetchReservations = async () => {
    try {
      const res = await ReservationService.getAll({ status: 'da_xac_nhan' });
      if (res.success) setReservations(res.data);
    } catch {}
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await TableService.updateStatus(id, newStatus);
      toast.success('Cập nhật trạng thái thành công');
      fetchTables();
    } catch {
      toast.error('Có lỗi khi cập nhật bàn');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.tableNumber) return toast.error('Vui lòng nhập số bàn');
    setIsCreating(true);
    try {
      await TableService.create({ 
        tableNumber: parseInt(createData.tableNumber), 
        capacity: parseInt(createData.capacity) 
      });
      toast.success('Thêm bàn thành công');
      setShowCreateModal(false);
      setCreateData({ tableNumber: '', capacity: 4 });
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi thêm bàn');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) return;
    setDeletingId(id);
    try {
      await TableService.delete(id);
      toast.success('Xóa bàn thành công');
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa bàn lúc này');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSel = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const toggleAll = () => {
    const filtered = filteredTables.map(t => t._id);
    const allSelected = filtered.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !filtered.includes(id)) : [...new Set([...selectedIds, ...filtered])]);
  };

  const handleBulkUpdate = async () => {
    if (!selectedIds.length) return;
    setIsBulkUpdating(true);
    try {
      await Promise.all(selectedIds.map(id => TableService.updateStatus(id, bulkStatus)));
      toast.success(`Đã cập nhật ${selectedIds.length} bàn thành công`);
      setSelectedIds([]);
      setIsEditMode(false);
      fetchTables();
    } catch {
      toast.error('Có lỗi khi cập nhật hàng loạt');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Thống kê
  const stats = {
    total:    tables.length,
    trong:    tables.filter(t => t.status === 'trong').length,
    serving:  tables.filter(t => t.status === 'dang_phuc_vu').length,
    reserved: tables.filter(t => t.status === 'dat_truoc').length,
    closed:   tables.filter(t => t.status === 'dong').length,
  };

  const filteredTables = filterStatus === 'all' ? tables : tables.filter(t => t.status === filterStatus);
  const allFilteredSelected = filteredTables.length > 0 && filteredTables.every(t => selectedIds.includes(t._id));

  const FILTER_TABS = [
    { key: 'all',          label: 'Tất cả',     count: stats.total    },
    { key: 'trong',        label: 'Trống',       count: stats.trong    },
    { key: 'dang_phuc_vu', label: 'Đang phục vụ',count: stats.serving  },
    { key: 'dat_truoc',    label: 'Đặt trước',   count: stats.reserved },
    { key: 'dong',         label: 'Đóng',        count: stats.closed   },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-admin tracking-tight">Quản Lý Bàn</h1>
          <p className="text-slate-500 mt-1 text-sm font-sans">Xem, chỉnh sửa và cập nhật trạng thái bàn ăn</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTables}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setIsEditMode(!isEditMode); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all ${
              isEditMode
                ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:text-primary-600 shadow-sm'
            }`}
          >
            {isEditMode ? <CheckSquare className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
            {isEditMode ? 'Hủy chỉnh sửa' : 'Bật chỉnh sửa'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm bàn
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số bàn',    value: stats.total,    icon: LayoutGrid,    bg: 'bg-sky-50 border-sky-200',        text: 'text-sky-600'     },
          { label: 'Đang phục vụ',   value: stats.serving,  icon: Utensils,      bg: 'bg-rose-50 border-rose-200',      text: 'text-rose-600'    },
          { label: 'Bàn trống',      value: stats.trong,    icon: CheckCircle2,  bg: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-600' },
          { label: 'Đã đặt trước',   value: stats.reserved, icon: CalendarClock, bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-600'   },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`flex items-center gap-4 p-4 rounded-2xl border ${card.bg}`}>
              <div className={`p-2.5 rounded-xl bg-white shadow-sm ${card.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-black font-mono ${card.text}`}>{card.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-5 border-b border-slate-100 bg-slate-50/60">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filterStatus === tab.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {tab.label} <span className="opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Table List */}
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Không có bàn nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Select All Row */}
              {isEditMode && (
                <div
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-primary-200 transition-colors"
                  onClick={toggleAll}
                >
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    readOnly
                    className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                  />
                  <span className="text-sm font-semibold text-slate-600">
                    Chọn tất cả ({selectedIds.length}/{filteredTables.length})
                  </span>
                </div>
              )}

              {filteredTables.map((table) => {
                const cfg = STATUS_CONFIG[table.status];
                const Icon = cfg.icon;
                const isUpdating = updating === table._id;
                const isSelected = selectedIds.includes(table._id);

                // Tìm đơn hàng đang xử lý của bàn
                const activeOrder = activeOrders.find(o =>
                  o.table?._id === table._id || o.table === table._id
                );
                const orderStats = activeOrder ? {
                  total: activeOrder.items.reduce((s, i) => s + i.quantity, 0),
                  served: activeOrder.items.filter(i => i.status === 'hoan_thanh').reduce((s, i) => s + i.quantity, 0),
                  amount: activeOrder.totalAmount
                } : null;

                // Tìm thông tin đặt bàn
                const reservation = reservations.find(r => 
                  (r.table?._id === table._id || r.table === table._id) && 
                  (r.status === 'da_xac_nhan' || r.status === 'cho_xac_nhan')
                );
                const reservationInfo = reservation ? parseReservationNote(reservation.note) : null;

                return (
                  <div
                    key={table._id}
                    className={`rounded-xl border transition-all duration-150 overflow-hidden
                      ${isSelected ? 'border-primary-300 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    onClick={() => isEditMode && toggleSel(table._id)}
                  >
                    {/* Main row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                      {/* Left — Info */}
                      <div className="flex items-center gap-4">
                        {isEditMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                          />
                        )}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 text-sm font-black flex-shrink-0 ${cfg.badge}`}>
                          {isUpdating
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : table.tableNumber
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-bold text-slate-900">Bàn {table.tableNumber}</span>
                            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${cfg.badge}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {table.capacity} khách</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400" /> {AREA_LABELS[table.area] || table.area}
                            </span>
                            {orderStats && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className={`font-semibold ${orderStats.served === orderStats.total ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  Lên món: {orderStats.served}/{orderStats.total}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 font-semibold">{orderStats.amount?.toLocaleString('vi-VN')}đ</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right — Actions */}
                      <div
                        className="flex items-center gap-3 w-full sm:w-auto"
                        onClick={e => isEditMode && e.stopPropagation()}
                      >
                        {isEditMode ? (
                          <div className="relative flex-1 sm:flex-none">
                            <select
                              value={table.status}
                              onChange={e => handleUpdateStatus(table._id, e.target.value)}
                              disabled={isUpdating}
                              className="w-full sm:w-44 appearance-none border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 bg-white text-slate-700 disabled:opacity-50"
                            >
                              {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                                <option key={key} value={key}>{c.label}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        ) : (
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${cfg.badge}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </span>
                        )}

                        {isEditMode && (
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(table._id); }}
                            disabled={deletingId === table._id}
                            className="p-2 border border-rose-200 rounded-lg text-rose-500 hover:text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
                            title="Xóa bàn"
                          >
                            {deletingId === table._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          </button>
                        )}

                        {table.qrCode && (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedQR({ tableNumber: table.tableNumber, qrCode: table.qrCode }); }}
                            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                            title="Xem mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reservation Info Banner */}
                    {reservation && (
                      <div className={`mx-4 mb-4 p-3 border rounded-xl space-y-2 ${reservation.status === 'cho_xac_nhan' ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className={`flex items-center justify-between gap-1.5 font-bold text-xs mb-2 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-700' : 'text-amber-700'}`}>
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5" /> 
                            {reservation.status === 'cho_xac_nhan' ? 'Có yêu cầu đặt bàn mới (Chờ duyệt)' : 'Thông tin đặt trước'}
                          </div>
                          {reservation.status === 'cho_xac_nhan' && (
                            <a href="/manager/reservations" className="text-[10px] underline hover:text-orange-800">Tới trang Quản lý đặt bàn</a>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="flex items-start gap-1.5">
                            <Users className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-500' : 'text-amber-500'}`} />
                            <div>
                              <div className={reservation.status === 'cho_xac_nhan' ? 'text-orange-600' : 'text-amber-600'}>Khách</div>
                              <div className="font-bold text-slate-800">{reservation.customerName || '—'}</div>
                            </div>
                          </div>
                          {reservation.customerPhone && (
                            <div className="flex items-start gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-amber-600">SĐT</div>
                                <div className="font-bold text-amber-900">{reservation.customerPhone}</div>
                              </div>
                            </div>
                          )}
                          {reservation.reservationTime && (
                            <div className="flex items-start gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-amber-600">Giờ đến</div>
                                <div className="font-bold text-amber-900">{reservation.reservationTime} · {reservation.partySize} người</div>
                              </div>
                            </div>
                          )}
                          {reservationInfo?.area && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-amber-600">Khu vực</div>
                                <div className="font-bold text-amber-900">{reservationInfo.area}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        {reservationInfo?.specialRequests?.length > 0 && (
                          <div className="flex items-start gap-1.5 pt-2 border-t border-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {reservationInfo.specialRequests.map((req, i) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-100 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
                                  {req}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order preview khi đang phục vụ */}
                    {table.status === 'dang_phuc_vu' && activeOrder && (
                      <div className="mx-4 mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                        <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs mb-2">
                          <Utensils className="w-3.5 h-3.5" /> {activeOrder.items.length} loại món đang phục vụ
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeOrder.items.slice(0, 6).map((item, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              item.status === 'hoan_thanh' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : item.status === 'dang_che_bien' ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}>
                              {item.quantity}x {item.menuItem?.name || 'Món ăn'}
                            </span>
                          ))}
                          {activeOrder.items.length > 6 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              +{activeOrder.items.length - 6} món
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* Bulk Update Toolbar */}
        {isEditMode && selectedIds.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <span className="text-sm text-slate-600 font-semibold">
              Đã chọn <span className="text-primary-600 font-black">{selectedIds.length}</span> bàn
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="flex-1 sm:w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 bg-white text-slate-700"
              >
                {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                  <option key={key} value={key}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={isBulkUpdating}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                {isBulkUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelectedQR(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-admin mb-1">Bàn Số {selectedQR.tableNumber}</h3>
            <p className="text-slate-500 text-sm mb-6">Đưa mã này cho khách hàng quét để gọi món</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <img src={selectedQR.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <button
              onClick={() => setSelectedQR(null)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 font-admin">Thêm Bàn Mới</h3>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Số bàn</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={createData.tableNumber}
                  onChange={e => setCreateData({...createData, tableNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  placeholder="Nhập số bàn (VD: 1, 2, 3...)"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Số ghế (Sức chứa)</label>
                <select
                  value={createData.capacity}
                  onChange={e => setCreateData({...createData, capacity: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                >
                  <option value={2}>2 người</option>
                  <option value={4}>4 người</option>
                  <option value={6}>6 người</option>
                  <option value={8}>8 người</option>
                  <option value={10}>10 người</option>
                  <option value={12}>12 người</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Khu vực</label>
                <select
                  value={createData.area}
                  onChange={e => setCreateData({...createData, area: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                >
                  {Object.entries(AREA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tạo Bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagePage;
