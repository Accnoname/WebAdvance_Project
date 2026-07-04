import { useState, useEffect } from 'react';
import { OrderService } from '../../services/order.service';
import useSocket from '../../hooks/useSocket';
import { ClipboardList, Clock, Filter, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  moi: { text: 'Mới', bg: 'bg-rose-50 text-rose-700 border border-rose-200' },
  dang_xu_ly: { text: 'Đang xử lý', bg: 'bg-amber-50 text-amber-700 border border-amber-200' },
  hoan_thanh: { text: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  da_huy: { text: 'Đã hủy', bg: 'bg-stone-50 text-stone-600 border border-stone-200' }
};

const StaffOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const socket = useSocket('staff');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (newOrder) => {
      setOrders(prev => {
        // Only add if it matches filter
        if (filter === 'all' || newOrder.orderStatus === filter) {
          return [newOrder, ...prev];
        }
        return prev;
      });
      toast.success(`Có đơn hàng mới từ Bàn ${newOrder.table?.tableNumber}!`);
    });

    socket.on('order:status-changed', ({ orderId, status }) => {
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, orderStatus: status } : order
      ));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status-changed');
    };
  }, [socket, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { orderStatus: filter } : {};
      const response = await OrderService.getAll(params);
      setOrders(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await OrderService.updateStatus(id, newStatus);
      toast.success('Cập nhật trạng thái thành công');
      // Optimistic update
      setOrders(prev => prev.map(order => 
        order._id === id ? { ...order, orderStatus: newStatus } : order
      ));
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
            <ClipboardList className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Quản Lý Đơn Hàng</h1>
            <p className="text-stone-500 font-medium mt-1">Theo dõi và cập nhật trạng thái các đơn hàng (Real-time)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border border-stone-200">
          <Filter className="w-5 h-5 text-stone-500 ml-3" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-stone-700 font-medium py-2 pr-8 cursor-pointer"
          >
            <option value="all">Tất cả đơn hàng</option>
            <option value="moi">Đơn mới</option>
            <option value="dang_xu_ly">Đang xử lý</option>
            <option value="hoan_thanh">Đã hoàn thành</option>
            <option value="da_huy">Đã hủy</option>
          </select>
          <button 
            onClick={fetchOrders}
            className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors"
            title="Tải lại"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-100">
          <ClipboardList className="w-16 h-16 text-stone-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-stone-900 mb-2">Không có đơn hàng nào</h3>
          <p className="text-stone-500">Chưa có đơn hàng nào khớp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-xs border-b border-stone-200/60 tracking-wider">
                <tr>
                  <th className="px-6 py-5">Mã Đơn / Thời gian</th>
                  <th className="px-6 py-5">Loại Đơn / Bàn</th>
                  <th className="px-6 py-5">Chi tiết món</th>
                  <th className="px-6 py-5">Tổng tiền</th>
                  <th className="px-6 py-5">Trạng thái</th>
                  <th className="px-6 py-5 text-right">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-black text-stone-900 text-base mb-1">#{order._id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {order.orderType === 'tai_ban' ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-stone-900 text-white font-black text-lg rounded-xl shadow-sm">
                            {order.table?.tableNumber || '?'}
                          </span>
                          <span className="text-xs text-stone-500 font-bold ml-1">Tại bàn</span>
                        </div>
                      ) : order.orderType === 'giao_hang' ? (
                        <div className="flex flex-col gap-1 max-w-[150px]">
                          <span className="text-xs font-bold px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg inline-block w-fit">Giao hàng</span>
                          <span className="text-xs text-stone-600 truncate font-medium" title={order.deliveryAddress}>{order.deliveryAddress}</span>
                          <span className="text-xs text-stone-500 font-medium">{order.deliveryPhone}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">Mang về</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <ul className="list-none space-y-1">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="truncate max-w-[200px] flex items-center gap-2">
                            <span className="font-black text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-xs">{item.quantity}</span>
                            <span className="font-medium">{item.menuItem?.name}</span>
                          </li>
                        ))}
                      </ul>
                      {order.items.length > 2 && (
                        <div className="text-xs text-stone-400 mt-2 italic font-medium">...và {order.items.length - 2} món khác</div>
                      )}
                    </td>
                    <td className="px-6 py-5 font-black text-base text-primary-600">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${STATUS_LABELS[order.orderStatus]?.bg}`}>
                        {STATUS_LABELS[order.orderStatus]?.text}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className="bg-stone-50 border border-stone-200/60 text-stone-700 text-sm font-bold rounded-xl focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 shadow-sm"
                      >
                        <option value="moi">Mới</option>
                        <option value="dang_xu_ly">Đang xử lý</option>
                        <option value="hoan_thanh">Hoàn thành</option>
                        <option value="da_huy">Đã hủy</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffOrdersPage;
