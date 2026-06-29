import { useState, useEffect } from 'react';
import { TableService } from '../../services/table.service';
import { Loader2, QrCode, Utensils, CalendarClock, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  trong: { label: 'Bàn trống', color: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
  dang_phuc_vu: { label: 'Đang phục vụ', color: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: Utensils },
  dat_truoc: { label: 'Đã đặt trước', color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: CalendarClock },
  dong: { label: 'Đóng', color: 'bg-stone-500', bg: 'bg-stone-100 border-stone-200', text: 'text-stone-700', icon: Ban },
};

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await TableService.getAll();
      if (response.success) {
        // Sort tables by tableNumber
        setTables(response.data.sort((a, b) => a.tableNumber - b.tableNumber));
      }
    } catch (error) {
      toast.error('Không thể tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    // Simple cycle through statuses for demo purposes
    const statusCycle = ['trong', 'dang_phuc_vu', 'dat_truoc', 'dong'];
    const nextIndex = (statusCycle.indexOf(currentStatus) + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIndex];

    try {
      await TableService.updateStatus(id, nextStatus);
      toast.success(`Đã cập nhật Bàn sang ${STATUS_CONFIG[nextStatus].label}`);
      fetchTables();
    } catch (error) {
      toast.error('Có lỗi khi cập nhật bàn');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-stone-900">Sơ Đồ Bàn</h1>
          <p className="text-stone-500 mt-2">Quản lý trạng thái bàn ăn và lấy mã QR cho khách</p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
              <span className="text-sm font-medium text-stone-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => {
            const config = STATUS_CONFIG[table.status];
            const Icon = config.icon;

            return (
              <div 
                key={table._id}
                className={`relative group bg-white rounded-3xl border-2 transition-all duration-300 hover:shadow-xl overflow-hidden ${config.bg}`}
              >
                {/* Content */}
                <div className="p-6 flex flex-col items-center text-center relative z-10">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm bg-white border ${config.bg}`}>
                    <span className="text-2xl font-display font-bold text-stone-900">{table.tableNumber}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.text}`} />
                    <span className={`font-bold text-sm ${config.text}`}>{config.label}</span>
                  </div>
                  <div className="text-stone-500 text-sm font-medium">Sức chứa: {table.capacity} khách</div>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex flex-col items-center justify-center gap-3">
                  <button
                    onClick={() => handleUpdateStatus(table._id, table.status)}
                    className="w-32 py-2 bg-white text-stone-900 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-100 transition-colors"
                  >
                    Đổi trạng thái
                  </button>
                  {table.qrCode && (
                    <button
                      onClick={() => setSelectedQR({ tableNumber: table.tableNumber, qrCode: table.qrCode })}
                      className="w-32 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-600/30 hover:bg-primary-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Xem QR Code
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col items-center text-center p-8">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-bold text-stone-900 mb-1">Bàn Số {selectedQR.tableNumber}</h3>
            <p className="text-stone-500 mb-6">Đưa mã này cho khách hàng quét để gọi món</p>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
              <img src={selectedQR.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>

            <button
              onClick={() => setSelectedQR(null)}
              className="mt-8 w-full py-3 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl font-bold transition-colors"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
