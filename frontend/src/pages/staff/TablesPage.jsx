import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TableService } from '../../services/table.service';
import { Loader2, QrCode, Utensils, CalendarClock, Ban, CheckCircle2, ListChecks, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  trong:        { label: 'Bàn trống',     color: 'bg-emerald-500', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10 border-emerald-500/30',   text: 'text-emerald-400', icon: CheckCircle2 },
  dang_phuc_vu: { label: 'Đang phục vụ', color: 'bg-rose-500',    ring: 'ring-rose-500/30',    bg: 'bg-rose-500/10 border-rose-500/30',          text: 'text-rose-400',    icon: Utensils },
  dat_truoc:    { label: 'Đã đặt trước', color: 'bg-amber-500',   ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10 border-amber-500/30',         text: 'text-amber-400',   icon: CalendarClock },
  dong:         { label: 'Đóng cửa',     color: 'bg-stone-500',   ring: 'ring-stone-500/30',   bg: 'bg-stone-500/10 border-stone-500/30',         text: 'text-stone-400',   icon: Ban },
};

const TablesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  // Tự động bật Edit Mode nếu navigate từ ?editMode=true
  const [isEditMode, setIsEditMode] = useState(searchParams.get('editMode') === 'true');
  const [selectedTables, setSelectedTables] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('trong');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    fetchTables();
    // Xoá query param sau khi đã đọc
    if (searchParams.get('editMode') === 'true') {
      setSearchParams({}, { replace: true });
    }
  }, []);

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

  const handleUpdateStatusDirect = async (id, newStatus) => {
    setUpdating(id);
    try {
      await TableService.updateStatus(id, newStatus);
      toast.success(`Cập nhật trạng thái bàn thành công`);
      fetchTables();
    } catch {
      toast.error('Có lỗi khi cập nhật bàn');
    } finally {
      setUpdating(null);
    }
  };

  const toggleTableSelection = (id) => {
    setSelectedTables(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map(t => t._id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedTables.length === 0) return toast.error('Vui lòng chọn ít nhất một bàn');
    
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedTables.map(id => TableService.updateStatus(id, bulkStatus))
      );
      toast.success(`Đã cập nhật ${selectedTables.length} bàn thành công`);
      setSelectedTables([]);
      setIsEditMode(false);
      fetchTables();
    } catch {
      toast.error('Có lỗi khi cập nhật hàng loạt');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
            <LayoutGrid className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Sơ Đồ Bàn</h1>
            <p className="text-stone-500 font-medium mt-1">Quản lý trạng thái và mã QR gọi món</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsEditMode(!isEditMode);
            setSelectedTables([]);
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 border
            ${isEditMode 
              ? 'bg-primary-500 text-white border-primary-500 shadow-sm active:scale-95' 
              : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900 hover:bg-stone-100 active:scale-95'}`}
        >
          {isEditMode ? <CheckSquare className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
          {isEditMode ? 'Hủy chỉnh sửa' : 'Bật chế độ chỉnh sửa'}
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden relative shadow-sm">
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Select All Checkbox */}
              {isEditMode && (
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 mb-2 cursor-pointer transition-colors hover:border-stone-300 shadow-sm" onClick={toggleAllSelection}>
                  <input 
                    type="checkbox" 
                    checked={selectedTables.length === tables.length && tables.length > 0}
                    readOnly
                    className="w-5 h-5 rounded border-stone-300 bg-white text-primary-500 focus:ring-primary-500/30"
                  />
                  <span className="text-stone-900 font-bold text-sm">Chọn tất cả ({selectedTables.length}/{tables.length})</span>
                </div>
              )}

              {tables.map((table) => {
                const config = STATUS_CONFIG[table.status];
                const Icon = config.icon;
                const isUpdating = updating === table._id;
                const isSelected = selectedTables.includes(table._id);

                return (
                  <div
                    key={table._id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-3xl border transition-all duration-200 bg-white shadow-sm
                      ${isSelected ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' : 'border-stone-200/60 hover:border-primary-500/50'}`}
                    onClick={() => isEditMode && toggleTableSelection(table._id)}
                  >
                    {/* Table Info */}
                    <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                      {isEditMode && (
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          readOnly
                          className="w-5 h-5 rounded border-stone-300 bg-white text-primary-500 focus:ring-primary-500/30 flex-shrink-0"
                        />
                      )}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm flex-shrink-0 ${config.bg}`}>
                        {isUpdating
                          ? <Loader2 className={`w-6 h-6 animate-spin ${config.text}`} />
                          : <span className={`text-2xl font-black ${config.text}`}>{table.tableNumber}</span>
                        }
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-stone-900 text-xl">Bàn {table.tableNumber}</span>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${config.bg} ${config.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </div>
                        <div className="text-stone-500 text-sm font-medium">{table.capacity} khách</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0" onClick={e => isEditMode && e.stopPropagation()}>
                      {isEditMode ? (
                        <div className="relative flex-1 sm:flex-none">
                          <select
                            value={table.status}
                            onChange={(e) => handleUpdateStatusDirect(table._id, e.target.value)}
                            disabled={isUpdating}
                            className={`w-full sm:w-48 appearance-none bg-stone-50 border border-stone-200/60 rounded-xl px-4 py-3 pr-10 text-sm font-bold focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50 text-stone-700 shadow-sm cursor-pointer`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <option key={key} value={key} className="bg-white text-stone-900">
                                {cfg.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-stone-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
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
                          className="p-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg border border-[#30363d] transition-colors hover:border-amber-500/50"
                          title="Xem mã QR"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulk Edit Toolbar */}
        {isEditMode && selectedTables.length > 0 && (
          <div className="sticky bottom-0 bg-[#21262d] border-t border-[#30363d] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="text-white font-bold">
              Đã chọn <span className="text-amber-500">{selectedTables.length}</span> bàn
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="flex-1 sm:w-48 appearance-none bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white"
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key} className="bg-[#161b22] text-white">{cfg.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={isBulkUpdating}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg font-black text-sm transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedQR(null)}
        >
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Bàn Số {selectedQR.tableNumber}</h3>
            <p className="text-stone-500 text-sm mb-6">Đưa mã này cho khách hàng quét để gọi món</p>
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <img src={selectedQR.qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <button
              onClick={() => setSelectedQR(null)}
              className="mt-6 w-full py-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-stone-300 rounded-xl font-bold transition-colors"
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
