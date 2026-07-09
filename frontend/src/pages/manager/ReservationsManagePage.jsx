import { useState, useEffect } from 'react';
import { ReservationService } from '../../services/reservation.service';
import { TableService } from '../../services/table.service';
import { Loader2, CalendarClock, CheckCircle, XCircle, Phone, Users, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  cho_xac_nhan: { label: 'Chờ xác nhận', bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: CalendarClock },
  da_xac_nhan: { label: 'Đã xác nhận', bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  da_den: { label: 'Đã check-in', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: ArrowRight },
  hoan_thanh: { label: 'Đã hoàn thành', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  da_huy: { label: 'Đã hủy', bg: 'bg-stone-100 text-stone-600 border-stone-200', icon: XCircle }
};

const ReservationsManagePage = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTables, setSelectedTables] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, tableData] = await Promise.all([
        ReservationService.getAll(),
        TableService.getAll()
      ]);
      setReservations(resData.data);
      
      const initialSelected = {};
      resData.data.forEach(r => {
        if (r.status === 'cho_xac_nhan') {
          initialSelected[r._id] = r.table?._id || '';
        }
      });
      setSelectedTables(initialSelected);

      // Hiển thị toàn bộ bàn (đã sắp xếp theo số bàn) để quản lý có thể xếp lịch tương lai
      setTables(tableData.data.sort((a, b) => a.tableNumber - b.tableNumber));
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, tableId = null) => {
    try {
      setUpdatingId(id);
      await ReservationService.updateStatus(id, status, tableId);
      toast.success('Cập nhật trạng thái thành công');
      fetchData(); // Tải lại để cập nhật cả bàn và đơn
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border shadow-sm">
          <CalendarClock className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-admin mb-1">Quản Lý Đặt Bàn</h1>
          <p className="text-slate-500 font-medium">Theo dõi và sắp xếp bàn cho khách hàng</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-5">Khách Hàng</th>
                <th className="px-6 py-5">Thời Gian</th>
                <th className="px-6 py-5">Thông Tin</th>
                <th className="px-6 py-5">Trạng Thái</th>
                <th className="px-6 py-5">Sắp Xếp Bàn</th>
                <th className="px-6 py-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((res) => {
                const config = STATUS_CONFIG[res.status];
                const Icon = config.icon;

                return (
                  <tr key={res._id} className="hover:bg-slate-50 transition-colors">
                    {/* Khách hàng */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{res.customerName}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {res.customerPhone}
                      </div>
                    </td>

                    {/* Thời gian */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary-500" /> {res.reservationTime}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {new Date(res.reservationDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    {/* Thông tin thêm */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium bg-slate-100 w-max px-2 py-1 rounded-lg">
                        <Users className="w-4 h-4" /> {res.partySize} khách
                      </div>
                      {res.note && (
                        <div className="text-sm text-slate-500 mt-2 max-w-[200px] truncate" title={res.note}>
                          Ghi chú: {res.note}
                        </div>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${config.bg}`}>
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </span>
                    </td>

                    {/* Sắp xếp bàn */}
                    <td className="px-6 py-4">
                      {res.status === 'cho_xac_nhan' ? (
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                          value={selectedTables[res._id] || ''}
                          onChange={(e) => setSelectedTables({ ...selectedTables, [res._id]: e.target.value })}
                        >
                          <option value="" disabled>Chọn bàn trống...</option>
                          {res.table && (
                            <option value={res.table._id}>Bàn {res.table.tableNumber} (Khách yêu cầu)</option>
                          )}
                          {tables.filter(t => t.capacity >= res.partySize && t._id !== res.table?._id).map(t => (
                            <option key={t._id} value={t._id}>
                              Bàn {t.tableNumber} ({t.capacity} chỗ)
                            </option>
                          ))}
                        </select>
                      ) : res.table ? (
                        <div className="font-bold text-primary-700 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 w-max">
                          Bàn {res.table.tableNumber}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Chưa xếp bàn</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right">
                      {res.status === 'cho_xac_nhan' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              if (!selectedTables[res._id]) {
                                toast.error('Vui lòng chọn bàn trước khi đồng ý!');
                                return;
                              }
                              handleUpdateStatus(res._id, 'da_xac_nhan', selectedTables[res._id]);
                            }}
                            disabled={updatingId === res._id}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Đồng ý"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(res._id, 'da_huy')}
                            disabled={updatingId === res._id}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Từ chối"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {res.status === 'da_xac_nhan' && (
                        <button
                          onClick={() => handleUpdateStatus(res._id, 'da_den')}
                          disabled={updatingId === res._id}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 w-full"
                        >
                          <ArrowRight className="w-4 h-4" /> Đã đến (Check-in)
                        </button>
                      )}
                      {res.status === 'da_den' && (
                        <button
                          onClick={() => handleUpdateStatus(res._id, 'hoan_thanh')}
                          disabled={updatingId === res._id}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 w-full"
                        >
                          Hoàn thành
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">
                    Chưa có đơn đặt bàn nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationsManagePage;
