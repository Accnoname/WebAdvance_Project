import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { OrderService } from '../../services/order.service';
import { TableService } from '../../services/table.service';
import { Trash2, Plus, Minus, ArrowRight, Loader2, Store, ShoppingBag, Truck, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const CartPage = () => {
  const { user } = useAuth();
  const { items, tableId, orderType, deliveryAddress, deliveryPhone, setTable, setOrderType, setDeliveryInfo, updateQuantity, updateNote, removeItem, clearCart, getTotalAmount, getTotalItems } = useCartStore();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  useEffect(() => {
    if (orderType === 'tai_ban') {
      fetchTables();
    }
  }, [orderType]);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const res = await TableService.getAll();
      if (res.success) {
        setTables(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt món!');
      navigate('/login');
      return;
    }
    if (isSubmitting) return;
    if (orderType === 'tai_ban' && !tableId) {
      toast.error('Vui lòng chọn bàn!');
      return;
    }
    if (orderType === 'giao_hang' && (!deliveryAddress?.trim() || !deliveryPhone?.trim())) {
      toast.error('Vui lòng nhập địa chỉ và số điện thoại!');
      return;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const payload = {
        orderType,
        tableId: orderType === 'tai_ban' ? tableId : undefined,
        deliveryAddress: orderType === 'giao_hang' ? deliveryAddress : undefined,
        deliveryPhone: orderType === 'giao_hang' ? deliveryPhone : undefined,
        items: items.map(i => ({
          menuItemId: i.menuItem._id,
          quantity: i.quantity,
          note: i.note,
          variant: i.variant
        })),
        note: orderNote
      };

      const res = await OrderService.create(payload);
      if (res.success) {
        toast.success('Đặt món thành công! Đơn hàng đang được nhà bếp chuẩn bị.');
        clearCart();
        navigate('/my-orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt món');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-fade-in-up flex flex-col items-center justify-center">
        <div className="w-48 h-48 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span className="text-6xl text-stone-300">🛒</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-stone-500 mb-8 text-center max-w-md">
          Có vẻ như bạn chưa chọn món nào. Hãy khám phá thực đơn hấp dẫn của chúng tôi và chọn cho mình những món ưng ý nhé!
        </p>
        <Link
          to="/menu"
          className="px-8 py-3 bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
        >
          Xem Thực Đơn
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#d4a85a] mb-2">Giỏ Hàng</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-stone-500 hover:text-rose-600 transition-colors underline underline-offset-4"
        >
          Xóa tất cả
        </button>
      </div>

      {/* Thông tin đơn hàng (Order Type Selection) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-bold text-stone-800 mb-4">Thông tin đặt món</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setOrderType('tai_ban')}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all ${
              orderType === 'tai_ban'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
            }`}
          >
            <Store className={`w-6 h-6 mb-2 ${orderType === 'tai_ban' ? 'text-primary-600' : 'text-stone-400'}`} />
            <span className="font-semibold text-sm">Ăn tại bàn</span>
          </button>

          <button
            onClick={() => setOrderType('giao_hang')}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all ${
              orderType === 'giao_hang'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-stone-100 bg-white text-stone-500 hover:border-stone-200'
            }`}
          >
            <Truck className={`w-6 h-6 mb-2 ${orderType === 'giao_hang' ? 'text-primary-600' : 'text-stone-400'}`} />
            <span className="font-semibold text-sm">Giao hàng</span>
          </button>
        </div>

        {orderType === 'tai_ban' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-stone-700">Chọn Bàn</label>
              {tableId && (
                <span className="text-sm text-primary-600 font-bold bg-primary-50 px-3 py-1 rounded-full">
                  Đã chọn: Bàn {tables.find(t => t._id === tableId)?.tableNumber}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsTableModalOpen(true)}
              className="w-full md:w-1/2 flex items-center justify-center gap-2 px-4 py-3 bg-stone-50 border border-stone-200 hover:border-primary-300 rounded-xl text-stone-900 font-bold transition-colors shadow-sm"
            >
              🗺️ Bấm để chọn bàn
            </button>
          </div>
        )}

        {orderType === 'giao_hang' && (
          <div className="animate-fade-in-up space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Số điện thoại</label>
              <input 
                type="tel" 
                placeholder="Nhập số điện thoại của bạn"
                value={deliveryPhone}
                onChange={(e) => setDeliveryInfo(deliveryAddress, e.target.value)}
                className="w-full md:w-1/2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Địa chỉ nhận hàng</label>
              <input 
                type="text" 
                placeholder="Nhập địa chỉ giao hàng chi tiết"
                value={deliveryAddress}
                onChange={(e) => setDeliveryInfo(e.target.value, deliveryPhone)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 mb-8">
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={`${item.menuItem._id}-${item.variant}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-stone-100 last:border-0 last:pb-0">
              <img
                src={item.menuItem.image?.startsWith('http') ? item.menuItem.image : `http://localhost:3000${item.menuItem.image}`}
                alt={item.menuItem.name}
                className="w-24 h-24 object-cover rounded-2xl bg-stone-100"
              />
              
              <div className="flex-grow">
                <h3 className="font-display font-bold text-lg text-stone-800">
                  {item.menuItem.name}
                </h3>
                {item.variant && (
                  <div className="text-sm text-primary-600 font-semibold mb-1">
                    Vị: {item.variant}
                  </div>
                )}
                <div className="text-stone-600 font-medium mb-2">
                  {item.price.toLocaleString('vi-VN')}đ
                </div>
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => updateNote(item.menuItem._id, item.note, e.target.value, item.variant)}
                  placeholder="Ghi chú (Không hành, ít cay...)"
                  className="w-full text-sm px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-primary-400"
                />
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6">
                <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 p-1">
                  <button
                    onClick={() => updateQuantity(item.menuItem._id, item.note, item.variant, item.quantity - 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-stone-500 transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-stone-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItem._id, item.note, item.variant, item.quantity + 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-stone-500 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right sm:min-w-[100px]">
                  <div className="font-bold text-stone-800">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.menuItem._id, item.note, item.variant)}
                  className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-stone-100">
          <label className="block text-sm font-semibold text-stone-700 mb-2">Ghi chú chung cho toàn bộ đơn hàng</label>
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Ví dụ: Xin thêm 3 chén nhỏ, mang đồ ăn ra cùng lúc..."
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
            rows="3"
          />
        </div>
      </div>

      <div className="bg-stone-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-stone-900/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-stone-400 text-sm font-medium mb-1">Tổng cộng ({getTotalItems()} món)</p>
            <div className="text-3xl font-display font-bold">
              {getTotalAmount().toLocaleString('vi-VN')}
              <span className="text-xl ml-1 text-primary-400">VNĐ</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg transition-all active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Đặt Món Ngay
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    {/* Table Selection Modal */}
    {isTableModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Sơ đồ chọn bàn</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1"><div className="w-4 h-4 bg-white border border-stone-200 rounded"></div> Trống</span>
                <span className="flex items-center gap-1"><div className="w-4 h-4 bg-rose-500 rounded text-white flex items-center justify-center text-[10px]">X</div> Đã có khách</span>
              </div>
            </div>
            <button onClick={() => setIsTableModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 bg-white rounded-full shadow-sm hover:shadow">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loadingTables ? (
              <div className="flex justify-center py-10 text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {tables.map(t => {
                  const isAvailable = t.status === 'trong';
                  const isSelected = tableId === t._id;
                  
                  return (
                    <button
                      key={t._id}
                      disabled={!isAvailable}
                      onClick={() => {
                        setTable(t._id);
                        setIsTableModalOpen(false);
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all p-2 ${
                        !isAvailable 
                          ? 'bg-rose-500 border-rose-600 opacity-90 cursor-not-allowed text-white shadow-inner' 
                          : isSelected
                            ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md scale-105'
                            : 'bg-white border-stone-200 hover:border-primary-300 hover:shadow text-stone-700'
                      }`}
                    >
                      <span className="text-xl font-black mb-1">{t.tableNumber}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${!isAvailable ? 'text-rose-100' : 'text-stone-400'}`}>
                        {t.capacity} chỗ
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default CartPage;
