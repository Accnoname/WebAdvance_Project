import { useState, useEffect, useMemo } from 'react';
import { OrderService } from '../../services/order.service';
import paymentService from '../../services/payment.service';
import useSocket from '../../hooks/useSocket';
import { ClipboardList, Clock, Filter, Loader2, RefreshCcw, BellRing, CheckCircle2, Banknote } from 'lucide-react';
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
        if (filter === 'all' || newOrder.orderStatus === filter) {
          return [newOrder, ...prev];
        }
        return prev;
      });
      toast.success(`Có đơn hàng mới từ Bàn ${newOrder.table?.tableNumber || '?'}!`);
    });

    socket.on('order:status-changed', ({ orderId, status }) => {
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, orderStatus: status } : order
      ));
    });

    socket.on('order:item-updated', ({ orderId, itemId, status }) => {
      setOrders(prev => prev.map(order => {
        if (order._id === orderId) {
          return {
            ...order,
            items: order.items.map(item => item._id === itemId ? { ...item, status } : item)
          };
        }
        return order;
      }));
    });

    socket.on('notification', (data) => {
      if (data.type === 'success') {
        toast.success(
          <div>
            <div className="font-bold">{data.title}</div>
            <div className="text-sm">{data.message}</div>
          </div>, 
          { duration: 6000 }
        );
      } else {
        toast(
          (t) => (
            <div className="flex gap-3 items-center">
              <BellRing className="w-6 h-6 text-amber-500 animate-bounce" />
              <div>
                <div className="font-bold text-stone-900">{data.title}</div>
                <div className="text-sm text-stone-600">{data.message}</div>
              </div>
            </div>
          ),
          { duration: 6000, style: { border: '1px solid #fcd34d', padding: '16px' } }
        );
      }
    });

    socket.on('payment:request', (data) => {
      // Thông báo cho staff biết có khách cần thu tiền mặt
      toast(
        (t) => (
          <div className="flex gap-3 items-center">
            <Banknote className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="font-bold text-stone-900">
                💰 Thu tiền Bàn {data.tableNumber || '?'}
              </div>
              <div className="text-sm text-stone-600">
                {data.amount?.toLocaleString('vi-VN')}đ — Tiền mặt
              </div>
            </div>
          </div>
        ),
        { duration: 10000, style: { border: '1px solid #6ee7b7', padding: '16px' } }
      );
    });

    socket.on('payment:success', ({ orderId }) => {
      setOrders(prev => prev.map(order =>
        order._id === orderId ? { ...order, isPaid: true } : order
      ));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status-changed');
      socket.off('order:item-updated');
      socket.off('notification');
      socket.off('payment:request');
      socket.off('payment:success');
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
      setOrders(prev => prev.map(order => 
        order._id === id ? { ...order, orderStatus: newStatus } : order
      ));
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleItemServed = async (orderId, itemId) => {
    try {
      await OrderService.updateItemStatus(orderId, itemId, 'hoan_thanh');
      toast.success('Đã xác nhận lên bàn!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xác nhận');
    }
  };

  const handleConfirmPayment = async (orderId, method) => {
    const methodText = method === 'tien_mat' ? 'tiền mặt' : 'chuyển khoản/online';
    if (!window.confirm(`Xác nhận đã thu ${methodText} từ khách?`)) return;
    try {
      await paymentService.confirmOffline(orderId, method);
      toast.success('✅ Đã xác nhận thanh toán thành công!');
      setOrders(prev => prev.map(order =>
        order._id === orderId ? { ...order, isPaid: true } : order
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    }
  };

  const handleCancelItem = async (orderId, itemId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy món này không?')) return;
    try {
      await OrderService.updateItemStatus(orderId, itemId, 'huy');
      toast.success('Đã hủy món thành công');
      fetchOrders(); // Tải lại để cập nhật tổng tiền
    } catch (error) {
      toast.error('Không thể hủy món này (có thể bếp đã làm xong)');
    }
  };

  const itemsToServe = useMemo(() => {
    const items = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.status === 'cho_phuc_vu') {
          items.push({
            ...item,
            orderId: order._id,
            tableNumber: order.table?.tableNumber,
            orderType: order.orderType
          });
        }
      });
    });
    return items;
  }, [orders]);

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

      {itemsToServe.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500 animate-pulse" />
            MÓN CHỜ BƯNG LÊN BÀN ({itemsToServe.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {itemsToServe.map((item, idx) => (
              <div key={idx} className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-lg text-stone-900 leading-tight">
                    {item.menuItem?.name}
                  </div>
                  <div className="font-black text-2xl text-amber-700 bg-amber-100 px-3 py-1 rounded-xl">
                    x{item.quantity}
                  </div>
                </div>
                <div className="mb-4">
                  {item.orderType === 'tai_ban' ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold bg-stone-900 text-white px-3 py-1 rounded-lg">
                      Bàn {item.tableNumber || '?'}
                    </span>
                  ) : item.orderType === 'mang_ve' ? (
                    <span className="text-sm font-bold bg-amber-200 text-amber-800 px-3 py-1 rounded-lg">Mang về</span>
                  ) : (
                    <span className="text-sm font-bold bg-primary-100 text-primary-700 px-3 py-1 rounded-lg">Giao hàng</span>
                  )}
                </div>
                <button
                  onClick={() => handleItemServed(item.orderId, item._id)}
                  className="mt-auto w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> ĐÃ LÊN BÀN
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        {order.items.map((item, idx) => {
                           let statusColor = "bg-stone-100";
                           if (item.status === 'cho_phuc_vu') statusColor = "bg-amber-100 text-amber-700 border border-amber-200";
                           else if (item.status === 'hoan_thanh') statusColor = "bg-emerald-100 text-emerald-700";
                           else if (item.status === 'huy') statusColor = "bg-red-100 text-red-700 line-through opacity-50";
                           
                           return (
                            <li key={idx} className="flex items-center gap-2 mb-1.5 group">
                              <span className={`font-black px-1.5 py-0.5 rounded text-xs ${statusColor}`}>{item.quantity}</span>
                              <span className={`font-medium text-stone-900 ${item.status === 'huy' ? 'line-through opacity-50' : ''}`}>{item.menuItem?.name}</span>
                              {item.status === 'cho_phuc_vu' && <span className="text-[10px] uppercase font-black text-amber-600 ml-1">Chờ bưng</span>}
                              {item.status === 'huy' && <span className="text-[10px] uppercase font-black text-red-600 ml-1">Đã hủy</span>}
                              
                              {['cho_xac_nhan', 'dang_che_bien'].includes(item.status) && (
                                <button 
                                  onClick={() => handleCancelItem(order._id, item._id)}
                                  className="opacity-0 group-hover:opacity-100 ml-auto text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded transition-opacity"
                                >
                                  Hủy món
                                </button>
                              )}
                            </li>
                           );
                        })}
                      </ul>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-base text-primary-600 mb-1">
                        {order.totalAmount.toLocaleString('vi-VN')}đ
                      </div>
                      {order.isPaid ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md flex items-center inline-flex gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> Đã Thu Tiền
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-md flex items-center inline-flex gap-1 w-max">
                          Chưa Thu Tiền
                        </span>
                      )}
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

                        {/* Nut xac nhan thu tien mat */}

                        {!order.isPaid && order.orderStatus !== 'da_huy' && (
                          <div className="mt-2 space-y-1.5">
                            <button
                              onClick={() => handleConfirmPayment(order._id, 'tien_mat')}
                              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] uppercase font-bold rounded-xl transition-colors"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Đã thu Tiền Mặt
                            </button>
                            <button
                              onClick={() => handleConfirmPayment(order._id, 'chuyen_khoan')}
                              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[11px] uppercase font-bold rounded-xl transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã thu Chuyển Khoản
                            </button>
                          </div>
                        )}

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
