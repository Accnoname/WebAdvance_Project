import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TableService } from '../../services/table.service';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';
import useSocket from '../../hooks/useSocket';
import {
  Loader2, QrCode, Utensils, CalendarClock, Ban, CheckCircle2,
  ListChecks, CheckSquare, LayoutGrid, Users, Clock, MapPin, Sparkles, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  trong:        { label: 'Bàn trống',     color: 'bg-emerald-500', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600', icon: CheckCircle2 },
  dang_phuc_vu: { label: 'Đang phục vụ', color: 'bg-rose-500',    ring: 'ring-rose-500/30',    bg: 'bg-rose-500/10 border-rose-500/30',       text: 'text-rose-600',    icon: Utensils },
  dat_truoc:    { label: 'Đã đặt trước', color: 'bg-amber-500',   ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10 border-amber-500/30',     text: 'text-amber-600',   icon: CalendarClock },
  dong:         { label: 'Đóng cửa',     color: 'bg-stone-500',   ring: 'ring-stone-500/30',   bg: 'bg-stone-500/10 border-stone-500/30',     text: 'text-stone-500',   icon: Ban },
};

const AREA_LABELS = {
  window: 'Khu cửa sổ',
  garden: 'Sân vườn',
  vip: 'Phòng VIP',
  main: 'Khu chính'
};

// Parse ghi chú đặt bàn để lấy khu vực & yêu cầu đặc biệt
const parseReservationNote = (note = '') => {
  const parts = note.split(' | ');
  let area = null;
  let specialRequests = [];
  let extraNote = '';

  parts.forEach(part => {
    if (part.startsWith('Khu vực: ')) {
      area = part.replace('Khu vực: ', '');
    } else if (part.startsWith('Yêu cầu đặc biệt: ')) {
      specialRequests = part.replace('Yêu cầu đặc biệt: ', '').split(', ');
    } else if (part) {
      extraNote = part;
    }
  });

  return { area, specialRequests, extraNote };
};

const TablesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  const [isEditMode, setIsEditMode] = useState(searchParams.get('editMode') === 'true');
  const [selectedTables, setSelectedTables] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('trong');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const socket = useSocket('staff');

  const fetchTables = useCallback(async () => {
    try {
      const res = await TableService.getAll();
      if (res.success) setTables(res.data.sort((a, b) => a.tableNumber - b.tableNumber));
    } catch { toast.error('Không thể tải danh sách bàn'); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await OrderService.getAll({ orderStatus: 'dang_xu_ly' });
      if (res.success) setActiveOrders(res.data);
    } catch {}
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      const res = await ReservationService.getAll({ status: 'da_xac_nhan' });
      if (res.success) setReservations(res.data);
    } catch {}
  }, []);

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

  useEffect(() => {
    if (!socket) return;
    socket.on('table:status-changed', fetchTables);
    socket.on('order:new', fetchOrders);
    socket.on('order:status-changed', fetchOrders);
    return () => {
      socket.off('table:status-changed');
      socket.off('order:new');
      socket.off('order:status-changed');
    };
  }, [socket]);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await TableService.updateStatus(id, newStatus);
      toast.success('Cập nhật trạng thái bàn thành công');
      fetchTables();
    } catch { toast.error('Có lỗi khi cập nhật bàn'); }
    finally { setUpdating(null); }
  };

  const toggleTableSelection = (id) => {
    setSelectedTables(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllSelection = () => {
    setSelectedTables(selectedTables.length === tables.length ? [] : tables.map(t => t._id));
  };

  const handleBulkUpdate = async () => {
    if (!selectedTables.length) return toast.error('Vui lòng chọn ít nhất một bàn');
    setIsBulkUpdating(true);
    try {
      await Promise.all(selectedTables.map(id => TableService.updateStatus(id, bulkStatus)));
      toast.success(`Đã cập nhật ${selectedTables.length} bàn thành công`);
      setSelectedTables([]);
      setIsEditMode(false);
      fetchTables();
    } catch { toast.error('Có lỗi khi cập nhật hàng loạt'); }
    finally { setIsBulkUpdating(false); }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
              <LayoutGrid className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-stone-900 tracking-tight">Sơ Đồ Bàn</h1>
              <p className="text-stone-500 font-medium mt-1">Trạng thái, đặt bàn và thông tin phục vụ</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                {cfg.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => { setIsEditMode(!isEditMode); setSelectedTables([]); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all border
              ${isEditMode
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'}`}
          >
            {isEditMode ? <CheckSquare className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
            {isEditMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
          </button>
        </div>

        {/* Table Grid */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Select All */}
                {isEditMode && (
                  <div
                    className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:border-stone-300"
                    onClick={toggleAllSelection}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTables.length === tables.length && tables.length > 0}
                      readOnly
                      className="w-5 h-5 rounded border-stone-300 text-primary-500"
                    />
                    <span className="text-stone-900 font-bold text-sm">
                      Chọn tất cả ({selectedTables.length}/{tables.length})
                    </span>
                  </div>
                )}

                {tables.map((table) => {
                  const config = STATUS_CONFIG[table.status];
                  const Icon = config.icon;
                  const isUpdating = updating === table._id;
                  const isSelected = selectedTables.includes(table._id);

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
                      className={`rounded-3xl border transition-all duration-200 bg-white shadow-sm overflow-hidden
                        ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50' : 'border-stone-200/60 hover:border-primary-500/40'}`}
                      onClick={() => isEditMode && toggleTableSelection(table._id)}
                    >
                      {/* Top row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">

                        {/* Left: Table info */}
                        <div className="flex items-center gap-4">
                          {isEditMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-5 h-5 rounded border-stone-300 text-primary-500 flex-shrink-0"
                            />
                          )}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm flex-shrink-0 relative ${config.bg}`}>
                            {isUpdating
                              ? <Loader2 className={`w-6 h-6 animate-spin ${config.text}`} />
                              : <span className={`text-2xl font-black ${config.text}`}>{table.tableNumber}</span>
                            }
                            {orderStats && orderStats.served === orderStats.total && (
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow border-2 border-white">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-stone-900 text-xl">Bàn {table.tableNumber}</span>
                              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${config.bg} ${config.text}`}>
                                <Icon className="w-3.5 h-3.5" />
                                {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-stone-500 font-medium flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {table.capacity} khách
                              </span>
                              <span className="text-stone-300">•</span>
                              <span className="flex items-center gap-1 font-semibold text-stone-600">
                                <MapPin className="w-3.5 h-3.5 text-stone-400" /> {AREA_LABELS[table.area] || table.area}
                              </span>
                              {orderStats && (
                                <>
                                  <span className="text-stone-300">•</span>
                                  <span className={`font-bold ${orderStats.served === orderStats.total ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    Lên món: {orderStats.served}/{orderStats.total}
                                  </span>
                                  <span className="text-stone-300">•</span>
                                  <span className="text-stone-600 font-semibold">
                                    {orderStats.amount?.toLocaleString('vi-VN')}đ
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3 w-full sm:w-auto" onClick={e => isEditMode && e.stopPropagation()}>
                          {isEditMode ? (
                            <div className="relative flex-1 sm:flex-none">
                              <select
                                value={table.status}
                                onChange={(e) => handleUpdateStatus(table._id, e.target.value)}
                                disabled={isUpdating}
                                className="w-full sm:w-48 appearance-none bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-stone-700 cursor-pointer disabled:opacity-50"
                              >
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <option key={key} value={key}>{cfg.label}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${config.bg} ${config.text}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {config.label}
                            </span>
                          )}

                          {table.qrCode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedQR({ tableNumber: table.tableNumber, qrCode: table.qrCode }); }}
                              className="p-2.5 bg-white hover:bg-stone-50 text-stone-500 rounded-xl border border-stone-200 shadow-sm hover:text-primary-600 hover:border-primary-400 transition-all"
                              title="Xem mã QR"
                            >
                              <QrCode className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reservation Info Banner — hiện khi bàn đặt trước hoặc khách yêu cầu đặt bàn */}
                      {reservation && (
                        <div className={`mx-5 mb-5 p-4 border rounded-2xl space-y-2 ${reservation.status === 'cho_xac_nhan' ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div className={`flex items-center justify-between gap-2 font-bold text-sm mb-3 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-700' : 'text-amber-700'}`}>
                            <div className="flex items-center gap-2">
                              <CalendarClock className="w-4 h-4" />
                              {reservation.status === 'cho_xac_nhan' ? 'Có yêu cầu đặt bàn mới (Chờ duyệt)' : 'Thông tin đặt trước'}
                            </div>
                            {reservation.status === 'cho_xac_nhan' && (
                              <a href="/staff/reservations" className="text-xs underline hover:text-orange-800">Tới trang Đặt Bàn</a>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Tên khách */}
                            <div className="flex items-start gap-2">
                              <Users className={`w-4 h-4 mt-0.5 flex-shrink-0 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-500' : 'text-amber-500'}`} />
                              <div>
                                <div className={`text-xs font-medium ${reservation.status === 'cho_xac_nhan' ? 'text-orange-600' : 'text-amber-600'}`}>Khách hàng</div>
                                <div className="text-sm font-bold text-slate-800">{reservation.customerName || '—'}</div>
                              </div>
                            </div>
                            {/* SĐT */}
                            {reservation.customerPhone && (
                              <div className="flex items-start gap-2">
                                <Phone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-500' : 'text-amber-500'}`} />
                                <div>
                                  <div className={`text-xs font-medium ${reservation.status === 'cho_xac_nhan' ? 'text-orange-600' : 'text-amber-600'}`}>Điện thoại</div>
                                  <div className="text-sm font-bold text-slate-800">{reservation.customerPhone}</div>
                                </div>
                              </div>
                            )}
                            {/* Giờ hẹn */}
                            {reservation.reservationTime && (
                              <div className="flex items-start gap-2">
                                <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-500' : 'text-amber-500'}`} />
                                <div>
                                  <div className={`text-xs font-medium ${reservation.status === 'cho_xac_nhan' ? 'text-orange-600' : 'text-amber-600'}`}>Giờ đến</div>
                                  <div className="text-sm font-bold text-slate-800">{reservation.reservationTime} — {reservation.partySize} người</div>
                                </div>
                              </div>
                            )}
                            {/* Khu vực */}
                            {reservationInfo?.area && (
                              <div className="flex items-start gap-2">
                                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${reservation.status === 'cho_xac_nhan' ? 'text-orange-500' : 'text-amber-500'}`} />
                                <div>
                                  <div className={`text-xs font-medium ${reservation.status === 'cho_xac_nhan' ? 'text-orange-600' : 'text-amber-600'}`}>Khu vực</div>
                                  <div className="text-sm font-bold text-slate-800">{AREA_LABELS[reservationInfo.area] || reservationInfo.area}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Yêu cầu đặc biệt */}
                          {reservationInfo?.specialRequests?.length > 0 && (
                            <div className="flex items-start gap-2 pt-2 border-t border-amber-200">
                              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-amber-600 font-medium mb-1">Yêu cầu đặc biệt</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {reservationInfo.specialRequests.map((req, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
                                      {req}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Ghi chú thêm */}
                          {reservationInfo?.extraNote && (
                            <div className="text-xs text-amber-600 italic pt-1 border-t border-amber-200">
                              Ghi chú: {reservationInfo.extraNote}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order items preview — khi đang phục vụ */}
                      {table.status === 'dang_phuc_vu' && activeOrder && (
                        <div className="mx-5 mb-5 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mb-2">
                            <Utensils className="w-3.5 h-3.5" />
                            Đang phục vụ — {activeOrder.items.length} loại món
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeOrder.items.slice(0, 5).map((item, i) => (
                              <span
                                key={i}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  item.status === 'hoan_thanh'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : item.status === 'dang_che_bien'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                              >
                                {item.quantity}x {item.menuItem?.name || 'Món ăn'}
                              </span>
                            ))}
                            {activeOrder.items.length > 5 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-200">
                                +{activeOrder.items.length - 5} món
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

          {/* Bulk Edit Toolbar */}
          {isEditMode && selectedTables.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-stone-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
              <div className="text-stone-900 font-bold">
                Đã chọn <span className="text-primary-600 font-black">{selectedTables.length}</span> bàn
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="flex-1 sm:w-48 appearance-none bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 text-stone-700"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={isBulkUpdating}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-black text-sm transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-sm active:scale-95"
                >
                  {isBulkUpdating && <Loader2 className="w-5 h-5 animate-spin" />}
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
          onClick={() => setSelectedQR(null)}
        >
          <div
            className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 border border-primary-100">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-stone-900 mb-2">Bàn Số {selectedQR.tableNumber}</h3>
            <p className="text-stone-500 text-sm mb-8">Đưa mã này cho khách hàng quét để gọi món</p>
            <div className="bg-white p-4 rounded-3xl shadow border border-stone-100">
              <img src={selectedQR.qrCode} alt="QR Code" className="w-48 h-48 rounded-xl" />
            </div>
            <button
              onClick={() => setSelectedQR(null)}
              className="mt-8 w-full py-4 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-2xl font-black transition-all active:scale-95"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TablesPage;
