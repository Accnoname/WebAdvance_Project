import { useState, useEffect, useMemo, useRef } from 'react';
import { OrderService } from '../../services/order.service';
import useSocket from '../../hooks/useSocket';
import { ChefHat, Clock, AlertCircle, CheckCircle2, LayoutGrid, Layers, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const LiveTimer = ({ createdAt, isPriority }) => {
  const [waitMins, setWaitMins] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
      setWaitMins(diff > 0 ? diff : 0);
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const isLate = waitMins >= 20 || isPriority;

  return (
    <div className={`text-sm font-bold flex items-center gap-1 mt-1 ${isLate ? 'text-rose-600' : 'text-stone-500'}`}>
      <Clock className="w-4 h-4" />
      {waitMins === 0 ? 'Vừa xong' : `Đợi ${waitMins} phút`}
    </div>
  );
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
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });
      toast.custom((t) => (
        <div className="bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 border border-stone-700">
          <Bell className="w-6 h-6 text-yellow-400 animate-bounce" />
          <div>
            <div className="font-bold">Đơn hàng mới!</div>
            <div className="text-sm text-stone-400">Bàn {newOrder.table?.tableNumber} vừa gọi món</div>
          </div>
        </div>
      ), { duration: 4000 });
      
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
      const response = await OrderService.getAll({ orderStatus: 'moi,dang_xu_ly' });
      // Bếp chỉ quan tâm các đơn có món đang 'cho_xac_nhan' hoặc 'dang_che_bien'
      const activeOrders = response.data.filter(o => 
        o.orderStatus !== 'hoan_thanh' && o.orderStatus !== 'da_huy' &&
        o.items.some(i => i.status === 'cho_xac_nhan' || i.status === 'dang_che_bien')
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
    const map = new Map(); // key: menuItemId_note_status
    orders.forEach(order => {
      order.items.forEach(item => {
        // Chỉ hiện lên view gộp nếu nó đang chờ xác nhận hoặc đang nấu
        if (item.status !== 'cho_xac_nhan' && item.status !== 'dang_che_bien') return;
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
          orderId: order._id,
          itemId: item._id,
          quantity: item.quantity
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.status === 'cho_xac_nhan' && b.status !== 'cho_xac_nhan') return -1;
      if (a.status !== 'cho_xac_nhan' && b.status === 'cho_xac_nhan') return 1;
      return b.totalQuantity - a.totalQuantity; // Highest quantity first
    });
  }, [orders]);

  const handleAggregatedAction = async (aggItem, newStatus) => {
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-white text-stone-900 p-6 rounded-3xl shadow-sm border border-stone-200/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
            <ChefHat className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-stone-900">Màn Hình Bếp</h1>
            <p className="text-stone-500 font-medium mt-1">Đồng bộ tự động theo thời gian thực</p>
          </div>
        </div>

        <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <button
            onClick={() => setViewMode('by-table')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'by-table' ? 'bg-white text-primary-600 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="w-5 h-5" /> Theo Bàn
          </button>
          <button
            onClick={() => setViewMode('aggregated')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'aggregated' ? 'bg-white text-primary-600 shadow-sm' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layers className="w-5 h-5" /> Gộp Món
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
            const activeItems = order.items.filter(i => i.status === 'cho_xac_nhan' || i.status === 'dang_che_bien');
            
            // Nếu không còn món nào cần bếp nấu thì ẩn card
            if (activeItems.length === 0) return null;

            // Kiểm tra xem đơn đã chờ trên 20 phút chưa để tô đỏ viền
            const waitMins = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
            const isLate = waitMins >= 20;

            return (
              <div 
                key={order._id} 
                className={`bg-white rounded-3xl p-6 shadow-sm transition-all duration-300 border-2 ${
                  isPriority || isLate ? 'border-rose-500 shadow-rose-100 ring-4 ring-rose-500/10' : 'border-stone-200/60'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-display font-bold text-stone-900 flex flex-wrap items-center gap-2">
                      Bàn {order.table?.tableNumber || '?'}
                      {(isPriority || isLate) && <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />}
                    </h3>
                    <LiveTimer createdAt={order.createdAt} isPriority={isPriority} />
                  </div>
                  <button
                    onClick={() => togglePriority(order._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                      isPriority 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Ưu tiên
                  </button>
                </div>

                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <div key={item._id} className="flex gap-5 p-5 rounded-2xl bg-stone-50 border border-stone-200/60 shadow-sm items-start">
                      <div className="font-black text-4xl text-primary-600 bg-white min-w-[70px] h-[70px] flex items-center justify-center rounded-2xl shadow-sm border border-stone-200/60 flex-shrink-0">
                        {item.quantity}
                      </div>
                      <div className="flex-grow pt-1">
                        <h4 className="font-bold text-2xl text-stone-900 leading-tight">{item.menuItem?.name}</h4>
                        {item.note && (
                          <div className="text-base text-rose-700 font-bold bg-rose-100 px-3 py-1 rounded-lg inline-block w-fit mt-2 border border-rose-200">
                            ⚠️ Ghi chú: {item.note}
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-3">
                          {item.status === 'cho_xac_nhan' && (
                            <button
                              onClick={() => handleUpdateItemStatus(order._id, item._id, 'dang_che_bien')}
                              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 tracking-wide text-base font-black rounded-xl shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                            >
                              🔥 BẮT ĐẦU NẤU
                            </button>
                          )}
                          {item.status === 'dang_che_bien' && (
                            <button
                              onClick={() => handleUpdateItemStatus(order._id, item._id, 'cho_phuc_vu')}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white tracking-wide text-base font-black rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                              <CheckCircle2 className="w-5 h-5" /> RA QUẦY PASS
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
          
          {sortedOrders.filter(o => o.items.some(i => i.status === 'cho_xac_nhan' || i.status === 'dang_che_bien')).length === 0 && (
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
            <div key={idx} className="bg-white rounded-3xl p-6 border-2 border-stone-200/60 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-stone-900 line-clamp-2 pr-4 leading-tight">
                  {agg.menuItem?.name}
                </h3>
                <div className="text-4xl font-black text-primary-600 bg-white min-w-[70px] h-[70px] flex items-center justify-center rounded-2xl shadow-sm border border-stone-200/60 flex-shrink-0">
                  {agg.totalQuantity}
                </div>
              </div>
              
              {agg.note && (
                <div className="text-base text-rose-700 font-bold bg-rose-100 px-3 py-2 rounded-xl mb-4 border border-rose-200">
                  ⚠️ Ghi chú chung: {agg.note}
                </div>
              )}

                <div className="flex-grow">
                  <div className="text-sm text-stone-500 mb-2 font-medium">Gồm các đơn:</div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {agg.tables.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 bg-stone-100 text-stone-900 font-bold text-sm rounded-lg border border-stone-200 flex items-center gap-1 shadow-sm">
                        Bàn {t.tableNumber} 
                        (x{t.quantity})
                      </span>
                    ))}
                  </div>
                </div>

              <div className="pt-5 border-t border-stone-200/60 mt-auto">
                {agg.status === 'cho_xac_nhan' && (
                  <button
                    onClick={() => handleAggregatedAction(agg, 'dang_che_bien')}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 tracking-wide text-stone-950 font-black text-lg rounded-xl shadow-sm active:scale-95 transition-all flex justify-center gap-2 items-center"
                  >
                    🔥 NẤU TẤT CẢ {agg.totalQuantity} PHẦN
                  </button>
                )}
                {agg.status === 'dang_che_bien' && (
                  <button
                    onClick={() => handleAggregatedAction(agg, 'cho_phuc_vu')}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 tracking-wide text-white font-black text-lg rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-6 h-6" /> TRẢ ĐỦ {agg.totalQuantity} PHẦN RA QUẦY
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

