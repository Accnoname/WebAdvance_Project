import { useState, useEffect, useMemo, useRef } from 'react';
import { OrderService } from '../../services/order.service';
import useSocket from '../../hooks/useSocket';
import { ChefHat, Clock, AlertCircle, CheckCircle2, LayoutGrid, Layers, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const STATUS_LABELS = {
  cho_xac_nhan: { text: 'Chờ nấu', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  dang_che_bien: { text: 'Đang nấu', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  hoan_thanh: { text: 'Xong', color: 'bg-green-50 text-green-700 border-green-200' }
};

const KitchenPage = () => {
  useDocumentTitle('Nhà Bếp');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('by-table'); // 'by-table' or 'aggregated'
  const [priorities, setPriorities] = useState([]);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const socket = useSocket('kitchen');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      toast.custom((t) => (
        <div className="bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 border border-stone-700">
          <Bell className="w-6 h-6 text-yellow-400 animate-bounce" />
          <div>
            <div className="font-bold">Đơn hàng mới!</div>
            <div className="text-sm text-stone-400">Bàn {newOrder.table?.tableNumber} vừa gọi món</div>
          </div>
        </div>
      ), { duration: 4000 });
      
      // Play sound
      audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
    });

    socket.on('order:item-updated', ({ orderId, itemId, status }) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item._id === itemId ? { ...item, status } : item
              )
            };
          }
          return order;
        })
      );
    });

    return () => {
      socket.off('order:new');
      socket.off('order:item-updated');
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const response = await OrderService.getAll({ orderStatus: 'moi' }); // Or whatever status means active
      // Filter out orders that are completely done
      const activeOrders = response.data.filter(o => 
        o.orderStatus !== 'hoan_thanh' && o.orderStatus !== 'da_huy' &&
        o.items.some(i => i.status !== 'hoan_thanh' && i.status !== 'huy')
      );
      setOrders(activeOrders);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      await OrderService.updateItemStatus(orderId, itemId, newStatus);
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) => {
          if (order._id === orderId) {
            return {
              ...order,
              items: order.items.map((item) =>
                item._id === itemId ? { ...item, status: newStatus } : item
              )
            };
          }
          return order;
        })
      );
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const togglePriority = (orderId) => {
    setPriorities(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Sort orders: Priorities first, then oldest first (FIFO)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aPriority = priorities.includes(a._id);
      const bPriority = priorities.includes(b._id);
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }, [orders, priorities]);

  // Aggregate items from all active orders
  const aggregatedItems = useMemo(() => {
    const map = new Map(); // key: menuItemId_note
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.status === 'hoan_thanh' || item.status === 'huy') return;
        // Bỏ qua nếu menuItem bị null (món đã bị xóa)
        if (!item.menuItem || !item.menuItem._id) return;

        const key = `${item.menuItem._id}_${item.note || ''}_${item.status}`;
        if (!map.has(key)) {
          map.set(key, {
            ...item,
            totalQuantity: 0,
            tables: []
          });
        }
        const entry = map.get(key);
        entry.totalQuantity += item.quantity;
        entry.tables.push({
          tableNumber: order.table?.tableNumber || '?',
          orderType: order.orderType,
          orderId: order._id,
          itemId: item._id,
          quantity: item.quantity
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      // Sort by status: cho_xac_nhan -> dang_che_bien
      if (a.status === 'cho_xac_nhan' && b.status !== 'cho_xac_nhan') return -1;
      if (a.status !== 'cho_xac_nhan' && b.status === 'cho_xac_nhan') return 1;
      return b.totalQuantity - a.totalQuantity; // Highest quantity first
    });
  }, [orders]);

  const handleAggregatedAction = async (aggItem, newStatus) => {
    // Process all instances of this aggregated item
    const promises = aggItem.tables.map(t => 
      OrderService.updateItemStatus(t.orderId, t.itemId, newStatus)
    );
    try {
      await Promise.all(promises);
      toast.success(`Đã cập nhật ${aggItem.totalQuantity} x ${aggItem.menuItem.name}`);
    } catch (err) {
      toast.error('Lỗi khi cập nhật hàng loạt');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-stone-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Màn Hình Bếp</h1>
            <p className="text-stone-400 text-sm mt-1">Đồng bộ tự động theo thời gian thực</p>
          </div>
        </div>

        <div className="flex bg-stone-800 p-1.5 rounded-xl border border-stone-700">
          <button
            onClick={() => setViewMode('by-table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'by-table' ? 'bg-primary-500 text-white shadow-lg' : 'text-stone-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Theo Bàn
          </button>
          <button
            onClick={() => setViewMode('aggregated')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'aggregated' ? 'bg-primary-500 text-white shadow-lg' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Gộp Món
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : viewMode === 'by-table' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedOrders.map((order) => {
            const isPriority = priorities.includes(order._id);
            const activeItems = order.items.filter(i => i.status !== 'hoan_thanh' && i.status !== 'huy');
            
            if (activeItems.length === 0) return null;

            return (
              <div 
                key={order._id} 
                className={`bg-[#161b22] rounded-3xl p-6 border-2 shadow-sm transition-all duration-300 ${
                  isPriority ? 'border-rose-500 shadow-rose-500/20' : 'border-[#30363d]'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white flex flex-wrap items-center gap-2">
                      {order.orderType === 'tai_ban' ? `Bàn ${order.table?.tableNumber || '?'}` : 
                       order.orderType === 'mang_ve' ? <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg text-sm">Mang về</span> : 
                       <span className="bg-primary-500/10 text-primary-400 px-2 py-1 rounded-lg text-sm">Giao hàng</span>}
                      {isPriority && <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />}
                    </h3>
                    <div className="text-sm text-stone-400 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePriority(order._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                      isPriority 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20' 
                        : 'bg-[#21262d] text-stone-400 border-[#30363d] hover:bg-[#30363d]'
                    }`}
                  >
                    Ưu tiên
                  </button>
                </div>

                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <div key={item._id} className="flex gap-4 p-4 rounded-2xl bg-[#21262d] border border-[#30363d]">
                      <div className="font-bold text-xl text-amber-500 bg-[#161b22] border border-[#30363d] w-10 h-10 flex items-center justify-center rounded-xl shadow-sm">
                        {item.quantity}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-white">{item.menuItem?.name}</h4>
                        {item.note && (
                          <div className="text-sm text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded flex inline-block w-fit mt-1">
                            Lưu ý: {item.note}
                          </div>
                        )}
                        
                        <div className="mt-3 flex gap-2">
                          {item.status === 'cho_xac_nhan' && (
                            <button
                              onClick={() => handleUpdateItemStatus(order._id, item._id, 'dang_che_bien')}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                            >
                              Bắt đầu nấu
                            </button>
                          )}
                          {item.status === 'dang_che_bien' && (
                            <button
                              onClick={() => handleUpdateItemStatus(order._id, item._id, 'hoan_thanh')}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Xong
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {sortedOrders.length === 0 && (
            <div className="col-span-full py-20 text-center text-stone-400">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Bếp đang rảnh rỗi. Chưa có đơn hàng nào!</p>
            </div>
          )}
        </div>
      ) : (
        /* Aggregated View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {aggregatedItems.map((agg, idx) => (
            <div key={idx} className="bg-[#161b22] rounded-3xl p-6 border-2 border-[#30363d] shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-display font-bold text-white line-clamp-2 pr-4">
                  {agg.menuItem?.name}
                </h3>
                <div className="text-3xl font-black text-amber-500 bg-[#21262d] border border-[#30363d] px-4 py-2 rounded-2xl">
                  {agg.totalQuantity}
                </div>
              </div>
              
              {agg.note && (
                <div className="text-sm text-amber-500 font-medium bg-amber-500/10 px-3 py-2 rounded-xl mb-4 border border-amber-500/30">
                  Ghi chú chung: {agg.note}
                </div>
              )}

                <div className="flex-grow">
                  <div className="text-sm text-stone-400 mb-2 font-medium">Gồm các đơn:</div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {agg.tables.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-[#21262d] text-stone-300 font-bold text-sm rounded-lg border border-[#30363d] flex items-center gap-1">
                        {t.orderType === 'tai_ban' ? `Bàn ${t.tableNumber}` : 
                         t.orderType === 'mang_ve' ? <span className="text-amber-500">Mang về</span> : 
                         <span className="text-primary-400">Giao hàng</span>} 
                        (x{t.quantity})
                      </span>
                    ))}
                  </div>
                </div>

              <div className="pt-4 border-t border-[#30363d] mt-auto">
                {agg.status === 'cho_xac_nhan' && (
                  <button
                    onClick={() => handleAggregatedAction(agg, 'dang_che_bien')}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    Nấu tất cả {agg.totalQuantity} phần
                  </button>
                )}
                {agg.status === 'dang_che_bien' && (
                  <button
                    onClick={() => handleAggregatedAction(agg, 'hoan_thanh')}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Trả đủ {agg.totalQuantity} phần
                  </button>
                )}
              </div>
            </div>
          ))}

          {aggregatedItems.length === 0 && (
            <div className="col-span-full py-20 text-center text-stone-400">
              <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Không có món nào đang chờ nấu!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
