import { useState, useEffect } from 'react';
import { OrderService } from '../../services/order.service';
import useSocket from '../../hooks/useSocket';
import { useCartStore } from '../../store/cartStore';
import { Loader2, CheckCircle2, ChefHat, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  cho_xac_nhan: { label: 'Đang đợi bếp', color: 'text-rose-500', bg: 'bg-rose-50', icon: Clock },
  dang_che_bien: { label: 'Đang nấu', color: 'text-amber-500', bg: 'bg-amber-50', icon: ChefHat },
  hoan_thanh: { label: 'Đã phục vụ', color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2 },
  huy: { label: 'Đã hủy', color: 'text-stone-400', bg: 'bg-stone-50', icon: AlertCircle }
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tableId } = useCartStore();
  
  // Listen to table specific updates
  const socket = useSocket(tableId ? `table:${tableId}` : null);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:item-updated', ({ orderId, itemId, status }) => {
      setOrders(prev => prev.map(order => {
        if (order._id === orderId) {
          const updatedItems = order.items.map(item => 
            item._id === itemId ? { ...item, status } : item
          );
          return { ...order, items: updatedItems };
        }
        return order;
      }));
      
      // Optional: Play small sound or show toast for customer
      if (status === 'hoan_thanh') {
        toast.success('Có món đã hoàn thành! Vui lòng chờ nhân viên mang ra bàn nhé.');
      }
    });

    socket.on('order:status-changed', ({ orderId, status }) => {
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, orderStatus: status } : order
      ));
    });

    return () => {
      socket.off('order:item-updated');
      socket.off('order:status-changed');
    };
  }, [socket]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      // Fetch personal order history
      const response = await OrderService.getMyOrders();
      setOrders(response.data);
    } catch (error) {
      toast.error('Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🍽️</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-[#d4a85a] mb-2">Chưa có đơn hàng nào</h2>
        <p className="text-stone-500">Hãy đặt món để trải nghiệm hương vị tuyệt vời của chúng tôi nhé!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-[#d4a85a]">Lịch Sử Đặt Món</h1>
        <p className="text-stone-500 mt-2">Theo dõi tiến độ món ăn của bạn theo thời gian thực</p>
      </div>

      <div className="space-y-8">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-100 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-stone-900">Mã đơn: #{order._id.slice(-6).toUpperCase()}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.orderStatus === 'hoan_thanh' ? 'bg-green-100 text-green-700' :
                    order.orderStatus === 'da_huy' ? 'bg-stone-100 text-stone-600' :
                    'bg-primary-50 text-primary-700'
                  }`}>
                    {order.orderStatus === 'hoan_thanh' ? 'Đã hoàn thành' : 
                     order.orderStatus === 'da_huy' ? 'Đã hủy' : 'Đang xử lý'}
                  </span>
                </div>
                <div className="text-sm text-stone-500 flex flex-wrap gap-4 mt-2">
                  {order.orderType === 'tai_ban' && <span>Bàn: {order.table?.tableNumber || '?'}</span>}
                  {order.orderType === 'mang_ve' && <span>Đơn mang về</span>}
                  {order.orderType === 'giao_hang' && <span>Giao hàng: {order.deliveryAddress}</span>}
                  <span>•</span>
                  <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
              <div className="text-right w-full md:w-auto bg-stone-50 p-4 rounded-2xl">
                <div className="text-sm text-stone-500 mb-1">Tổng tiền</div>
                <div className="text-2xl font-display font-bold text-primary-600">
                  {order.totalAmount.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {order.items.map((item, index) => {
                const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.cho_xac_nhan;
                const Icon = config.icon;

                return (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <img 
                      src={item.menuItem?.image?.startsWith('http') ? item.menuItem.image : `http://localhost:3000${item.menuItem?.image}`} 
                      alt={item.menuItem?.name} 
                      className="w-20 h-20 rounded-2xl object-cover bg-stone-100"
                    />
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-stone-900 text-lg">
                            {item.quantity} x {item.menuItem?.name}
                          </h4>
                          <div className="text-primary-600 font-medium">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${config.bg} ${config.color} transition-colors duration-500`}>
                          <Icon className={`w-4 h-4 ${item.status === 'dang_che_bien' ? 'animate-bounce' : ''}`} />
                          {config.label}
                        </div>
                      </div>
                      
                      {item.note && (
                        <div className="mt-2 text-sm text-stone-500 bg-stone-50 p-2 rounded-lg inline-block">
                          Ghi chú: {item.note}
                        </div>
                      )}

                      {/* Timeline bar */}
                      <div className="mt-4 flex gap-1 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${
                          ['cho_xac_nhan', 'dang_che_bien', 'hoan_thanh'].includes(item.status) ? 'bg-rose-500 w-1/3' : 'w-0'
                        }`} />
                        <div className={`h-full transition-all duration-1000 ${
                          ['dang_che_bien', 'hoan_thanh'].includes(item.status) ? 'bg-amber-500 w-1/3' : 'w-0'
                        }`} />
                        <div className={`h-full transition-all duration-1000 ${
                          item.status === 'hoan_thanh' ? 'bg-green-500 w-1/3' : 'w-0'
                        }`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons for Active Orders */}
            {order.orderStatus !== 'hoan_thanh' && order.orderStatus !== 'da_huy' && (
              <div className="mt-8 pt-6 border-t border-stone-100 flex gap-4">
                <button
                  onClick={() => toast('Tính năng Gọi Nhân Viên đang được phát triển!')}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  Gọi Nhân Viên
                </button>
                <button
                  onClick={() => window.location.href = `/payment/${order._id}`}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  💳 Yêu Cầu Thanh Toán
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrdersPage;
