import { useState, useEffect } from 'react';
import { OrderService } from '../../services/order.service';
import useSocket from '../../hooks/useSocket';
import { ClipboardList, Clock, Filter, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  moi: { text: 'Mới', bg: 'bg-rose-100 text-rose-700' },
  dang_xu_ly: { text: 'Đang xử lý', bg: 'bg-amber-100 text-amber-700' },
  hoan_thanh: { text: 'Hoàn thành', bg: 'bg-green-100 text-green-700' },
  da_huy: { text: 'Đã hủy', bg: 'bg-stone-100 text-stone-600' }
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-900">Quản Lý Đơn Hàng</h1>
            <p className="text-stone-500 mt-1">Theo dõi và cập nhật trạng thái các đơn hàng (Real-time)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-stone-100">
          <Filter className="w-5 h-5 text-stone-400 ml-2" />
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
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-stone-900 uppercase font-display font-bold text-xs border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4">Mã Đơn / Thời gian</th>
                  <th className="px-6 py-4">Loại Đơn / Bàn</th>
                  <th className="px-6 py-4">Chi tiết món</th>
                  <th className="px-6 py-4">Tổng tiền</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900 mb-1">#{order._id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.orderType === 'tai_ban' ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-stone-900 text-white font-bold rounded-lg">
                            {order.table?.tableNumber || '?'}
                          </span>
                          <span className="text-xs text-stone-500 font-bold">Tại bàn</span>
                        </div>
                      ) : order.orderType === 'giao_hang' ? (
                        <div className="flex flex-col gap-1 max-w-[150px]">
                          <span className="text-xs font-bold px-2 py-1 bg-primary-100 text-primary-700 rounded-lg inline-block w-fit">Giao hàng</span>
                          <span className="text-xs text-stone-600 truncate" title={order.deliveryAddress}>{order.deliveryAddress}</span>
                          <span className="text-xs text-stone-500">{order.deliveryPhone}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">Mang về</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ul className="list-disc list-inside space-y-1">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="truncate max-w-[200px]">
                            {item.quantity}x {item.menuItem?.name}
                          </li>
                        ))}
                      </ul>
                      {order.items.length > 2 && (
                        <div className="text-xs text-stone-400 mt-1 italic">...và {order.items.length - 2} món khác</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary-600">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${STATUS_LABELS[order.orderStatus]?.bg}`}>
                        {STATUS_LABELS[order.orderStatus]?.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className="bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block w-full p-2"
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
