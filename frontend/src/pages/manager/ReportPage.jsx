import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Download, FileText, Filter, ChevronLeft, ChevronRight,
  TrendingUp, Search, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { OrderService } from '../../services/order.service';
import { ReportService } from '../../services/report.service';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  moi: { label: 'Mới', style: 'bg-blue-50 text-blue-700' },
  dang_xu_ly: { label: 'Đang xử lý', style: 'bg-amber-50 text-amber-700' },
  hoan_thanh: { label: 'Hoàn thành', style: 'bg-emerald-50 text-emerald-700' },
  da_huy: { label: 'Đã hủy', style: 'bg-rose-50 text-rose-700' },
};

const PAYMENT_METHOD_LABELS = {
  tien_mat: 'Tiền mặt',
  chuyen_khoan: 'Chuyển khoản',
  vnpay: 'VNPay',
  khac: 'Khác'
};

const ReportPage = () => {
  useDocumentTitle('Báo Cáo Chi Tiết');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, orders: 0, aov: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await OrderService.getAll({ page: pagination.page, limit: pagination.limit, status: filterStatus });
      if (res.success || res.data) {
        setOrders(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu báo cáo:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterStatus]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await ReportService.getRevenue({ period: 'month' });
      if (res.success) {
        setSummary(res.data.summary || { total: 0, orders: 0, aov: 0 });
      }
    } catch (error) {
      console.error('Lỗi khi lấy tổng quan:', error);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fmtMoney = (v) => v.toLocaleString('vi-VN') + 'đ';

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const toastId = toast.loading('Đang trích xuất dữ liệu, vui lòng chờ...');
      
      // Gọi API lấy TẤT CẢ giao dịch thoả mãn bộ lọc (limit lớn) để xuất excel
      const res = await OrderService.getAll({ page: 1, limit: 10000, status: filterStatus });
      
      if (!res.success || !res.data || res.data.length === 0) {
        toast.dismiss(toastId);
        toast.error('Không có dữ liệu để xuất Excel!');
        return;
      }

      // Chuẩn bị dữ liệu để xuất
      const excelData = res.data.map((order, index) => ({
        'STT': index + 1,
        'Mã Đơn': `#${order._id.slice(-6).toUpperCase()}`,
        'Thời Gian': new Date(order.createdAt).toLocaleString('vi-VN'),
        'Khu Vực': order.table?.tableNumber ? `Bàn ${order.table.tableNumber}` : 'Mang đi',
        'Hình Thức Thanh Toán': PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || 'Chưa TT',
        'Trạng Thái': STATUS_LABELS[order.orderStatus]?.label || order.orderStatus,
        'Tổng Tiền (VNĐ)': order.totalAmount,
        'Ghi Chú': order.note || ''
      }));

      // Tạo workbook & worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSuGiaoDich');

      // Tải file về
      XLSX.writeFile(workbook, `BaoCao_GiaoDich_${new Date().getTime()}.xlsx`);
      
      toast.dismiss(toastId);
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error('Có lỗi xảy ra khi xuất file!');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1600px] mx-auto min-h-full bg-slate-50">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-admin tracking-tight">Báo Cáo Giao Dịch</h1>
          <p className="text-slate-500 mt-1 font-sans text-sm">Tra cứu và phân tích chi tiết dữ liệu kinh doanh</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Doanh thu tháng này</p>
            <p className="text-2xl font-black font-mono text-slate-900 mt-1">{fmtMoney(summary.total)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Đơn hàng hoàn thành</p>
            <p className="text-2xl font-black font-mono text-slate-900 mt-1">{summary.orders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Giá trị TB đơn</p>
            <p className="text-2xl font-black font-mono text-slate-900 mt-1">{fmtMoney(summary.aov)}</p>
          </div>
        </div>
      </div>

      {/* FILTER & TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
        
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 font-admin">Lịch sử giao dịch</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm mã đơn hàng..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 font-sans"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="border-none bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="hoan_thanh">Đã hoàn thành</option>
              <option value="da_huy">Đã hủy</option>
              <option value="dang_xu_ly">Đang xử lý</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã Đơn</th>
                <th className="px-6 py-4 font-semibold">Thời Gian</th>
                <th className="px-6 py-4 font-semibold">Bàn / Dịch vụ</th>
                <th className="px-6 py-4 font-semibold">Thanh Toán</th>
                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold text-right">Tổng Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">Không tìm thấy giao dịch nào</td>
                </tr>
              ) : (
                orders.map(order => {
                  const status = STATUS_LABELS[order.orderStatus] || { label: order.orderStatus, style: 'bg-slate-100' };
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {order.table?.tableNumber ? `Bàn ${order.table.tableNumber}` : 'Mang đi / Giao hàng'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${status.style} border-opacity-20`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-base">
                        {order.totalAmount.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Hiển thị <span className="font-bold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> đến <span className="font-bold text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong số <span className="font-bold text-slate-700">{pagination.total}</span> giao dịch
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700 px-3">Trang {pagination.page} / {pagination.totalPages}</span>
            <button 
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportPage;
