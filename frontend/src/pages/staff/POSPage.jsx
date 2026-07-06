import { useState, useEffect, useMemo } from 'react';
import { MenuService } from '../../services/menu.service';
import { TableService } from '../../services/table.service';
import { OrderService } from '../../services/order.service';
import useSocket from '../../hooks/useSocket';
import { Loader2, Plus, Minus, Search, ShoppingCart, Trash2, CheckCircle2, User, Coffee, UtensilsCrossed, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import formatCurrency from '../../utils/formatCurrency';

const CATEGORY_ICONS = {
  'Món chính': UtensilsCrossed,
  'Đồ uống': Coffee,
};

const POSPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [activeOrder, setActiveOrder] = useState(null); // If table is dang_phuc_vu

  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const socket = useSocket('staff');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuRes, tableRes] = await Promise.all([
          MenuService.getAll(),
          TableService.getAll()
        ]);
        
        if (menuRes.success) {
          const items = menuRes.data.filter(item => item.isAvailable);
          setMenuItems(items);
          const cats = ['All', ...new Set(items.map(item => item.category))];
          setCategories(cats);
        }
        
        if (tableRes.success) {
          // Only show tables that are empty or currently serving
          const validTables = tableRes.data
            .filter(t => t.status === 'trong' || t.status === 'dang_phuc_vu')
            .sort((a, b) => a.tableNumber - b.tableNumber);
          setTables(validTables);
        }
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu POS');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // When table selection changes, check if we need to load active order
  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!selectedTableId) {
        setActiveOrder(null);
        return;
      }
      const table = tables.find(t => t._id === selectedTableId);
      if (table && table.status === 'dang_phuc_vu') {
        try {
          const res = await OrderService.getAll({ table: selectedTableId, orderStatus: 'moi,dang_xu_ly,cho_thanh_toan' });
          if (res.success && res.data.length > 0) {
            setActiveOrder(res.data[0]); // Get the active one
          } else {
            setActiveOrder(null);
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setActiveOrder(null);
      }
    };
    fetchActiveOrder();
  }, [selectedTableId, tables]);

  // Socket updates for tables
  useEffect(() => {
    if (!socket) return;
    socket.on('table:status-changed', async () => {
      const res = await TableService.getAll();
      if (res.success) {
        setTables(res.data.filter(t => t.status === 'trong' || t.status === 'dang_phuc_vu').sort((a, b) => a.tableNumber - b.tableNumber));
      }
    });
    return () => {
      socket.off('table:status-changed');
    };
  }, [socket]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      if (existing) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.menuItemId === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.menuItemId !== id));
  };

  const updateNote = (id, note) => {
    setCart(prev => prev.map(item => item.menuItemId === id ? { ...item, note } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!selectedTableId) return toast.error('Vui lòng chọn bàn trước khi order');
    if (cart.length === 0) return toast.error('Giỏ hàng đang trống');

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note
      }));

      if (activeOrder) {
        // Gộp món vào đơn đang chạy
        await OrderService.addItems(activeOrder._id, itemsPayload);
        toast.success('Đã thêm món vào đơn hiện tại!');
      } else {
        // Tạo đơn mới
        await OrderService.create({
          tableId: selectedTableId,
          orderType: 'tai_ban',
          items: itemsPayload
        });
        toast.success('Đã gửi order xuống bếp!');
      }
      
      setCart([]);
      setSelectedTableId('');
      setActiveOrder(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 p-4 lg:p-6 overflow-hidden bg-stone-50/50">
      
      {/* LEFT PANEL: Menu Items (70%) */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200/60 overflow-hidden">
        {/* Header & Search */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white z-10">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat] || UtensilsCrossed;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all
                    ${activeCategory === cat ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  {cat !== 'All' && <Icon className="w-4 h-4" />}
                  {cat === 'All' ? 'Tất cả' : cat}
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm món ăn..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-stone-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
            {filteredItems.map(item => (
              <div 
                key={item._id}
                onClick={() => addToCart(item)}
                className="bg-white p-3 rounded-2xl border border-stone-200/80 hover:border-primary-500/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-stone-100 relative">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur text-stone-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-stone-800 text-sm line-clamp-2 leading-tight">{item.name}</h3>
                  </div>
                  <div className="mt-2 font-black text-primary-600">
                    {formatCurrency(item.price)}
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 text-center text-stone-400 font-medium">
                Không tìm thấy món ăn phù hợp
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Cart & Table Selection (30%) */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-3xl shadow-sm border border-stone-200/60 overflow-hidden flex-shrink-0">
        
        {/* Table Selection */}
        <div className="p-5 border-b border-stone-100 bg-stone-50/50">
          <label className="block text-xs font-black text-stone-500 uppercase tracking-wider mb-2">Chọn Bàn Phục Vụ</label>
          <div className="relative">
            <select
              value={selectedTableId}
              onChange={e => setSelectedTableId(e.target.value)}
              className={`w-full appearance-none border-2 rounded-2xl px-4 py-3.5 pr-10 font-bold text-base transition-all focus:outline-none cursor-pointer
                ${selectedTableId ? 'bg-white border-primary-500 text-stone-900 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'}`}
            >
              <option value="">-- Vui lòng chọn bàn --</option>
              {tables.map(t => (
                <option key={t._id} value={t._id}>
                  Bàn {t.tableNumber} {t.status === 'dang_phuc_vu' ? '(Đang phục vụ - Gộp thêm món)' : '(Bàn trống)'}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-stone-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          
          {activeOrder && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold animate-fade-in-up">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Bàn đang phục vụ. Order này sẽ được gộp vào đơn hiện tại.
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-3">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center border border-stone-100">
                <ShoppingCart className="w-8 h-8 text-stone-300" />
              </div>
              <p className="font-medium text-sm">Chưa có món nào được chọn</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {cart.map(item => (
                <div key={item.menuItemId} className="bg-white border border-stone-100 p-3 rounded-2xl shadow-sm hover:border-stone-200 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-stone-800 text-sm leading-tight">{item.name}</div>
                      <div className="font-semibold text-primary-600 text-xs mt-1">{formatCurrency(item.price)}</div>
                    </div>
                    <button onClick={() => removeItem(item.menuItemId)} className="p-1.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 gap-3">
                    <input
                      type="text"
                      placeholder="Ghi chú (ít cay...)"
                      value={item.note}
                      onChange={e => updateNote(item.menuItemId, e.target.value)}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/60">
                      <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-stone-900 active:scale-95"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-8 text-center font-black text-sm text-stone-800">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-stone-600 hover:text-stone-900 active:scale-95"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout */}
        <div className="p-5 bg-stone-900 rounded-t-3xl text-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-stone-400 text-sm">Tổng cộng ({cart.reduce((s, i) => s + i.quantity, 0)} món)</span>
            <span className="text-2xl font-black text-white">{formatCurrency(cartTotal)}</span>
          </div>
          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || !selectedTableId || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
            {activeOrder ? 'Gộp Đơn Cũ & Gửi Bếp' : 'Gửi Bếp Nấu Món'}
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default POSPage;
