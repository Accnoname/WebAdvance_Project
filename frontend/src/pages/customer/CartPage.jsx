import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';
import { Trash2, Plus, Minus, ArrowRight, Loader2, CalendarCheck, Ticket, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import VoucherSelectorModal from '../../components/VoucherSelectorModal';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const CartPage = () => {
  const { user } = useAuth();
  const {
    items, tableId,
    setTable, updateQuantity,
    updateNote, removeItem, clearCart, getTotalAmount, getTotalItems
  } = useCartStore();
  const navigate = useNavigate();
  const [inputVoucher, setInputVoucher] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [tablesList, setTablesList] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const subTotal = getTotalAmount();
  useEffect(() => {
    if (appliedVoucher) {
      setAppliedVoucher(null);
      setDiscountAmount(0);
      toast('Giỏ hàng thay đổi, vui lòng áp dụng lại mã giảm giá.', { icon: 'ℹ️' });
    }
  }, [subTotal]);

  const fetchReservations = async () => {
    if (!user) return;
    setLoadingRes(true);
    try {
      const res = await ReservationService.getMyReservations();
      if (res.success) {
        setReservations(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoadingRes(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await TableService.getAll();
      if (res.success) {
        setTablesList(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReservations();
      fetchTables();
    }
  }, [user]);

  const handleSelectTableClick = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chọn bàn!');
      navigate('/login');
      return;
    }
    if (tablesList.length === 0) {
      toast.error('Không tìm thấy danh sách bàn ăn trong nhà hàng!');
      return;
    }
    setIsTableModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt món!');
      navigate('/login');
      return;
    }
    if (isSubmitting) return;
    if (!tableId) {
      toast.error('Vui lòng chọn bàn đặt trước của bạn!');
      return;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const payload = {
        tableId: typeof tableId === 'object' ? tableId?._id : tableId,
        items: items.map(i => ({
          menuItemId: i.menuItem._id,
          quantity: i.quantity,
          note: i.note,
          variant: i.variant
        })),
        note: orderNote,
        voucherCode: appliedVoucher?.code || undefined
      };

      if (orderType === 'tai_ban') {
        payload.tableId = typeof tableId === 'object' ? tableId?._id : tableId;
      } else if (orderType === 'giao_hang') {
        payload.deliveryAddress = deliveryAddress;
        payload.deliveryPhone = deliveryPhone;
      }

      if (voucherCode) {
        payload.voucherCode = voucherCode;
      }

      const res = await OrderService.create(payload);
      if (res.success) {
        clearCart();
        // Chuyển sang trang thanh toán với orderId
        navigate(`/payment/${res.data._id}`);
        toast.success('Đặt món thành công! Vui lòng chọn phương thức thanh toán.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt món');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!inputVoucher.trim()) {
      toast.error('Vui lòng nhập mã giảm giá!');
      return;
    }
    setIsApplyingVoucher(true);
    try {
      await applyVoucher(inputVoucher.trim());
      toast.success('Áp dụng mã giảm giá thành công!');
      setInputVoucher('');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    removeVoucher();
    setInputVoucher('');
    toast.success('Đã gỡ mã giảm giá');
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

  const getTableNumber = (tId) => {
    if (!tId) return '';
    if (typeof tId === 'object' && tId) return tId.tableNumber;
    const foundTable = tablesList.find(t => t._id === tId);
    if (foundTable) return foundTable.tableNumber;
    const foundRes = reservations.find(r => r.table?._id === tId);
    if (foundRes) return foundRes.table?.tableNumber;
    return tId;
  };

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

        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-stone-700">Bàn đã đặt trước</label>
            {tableId && (
              <span className="text-sm text-primary-600 font-bold bg-primary-50 px-3 py-1 rounded-full">
                ✓ {getSelectedTableDisplay()}
              </span>
            )}
          </div>
          <button
            onClick={handleSelectTableClick}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-stone-50 border border-stone-200 hover:border-primary-300 rounded-xl text-stone-900 font-bold transition-colors shadow-sm"
          >
            <CalendarCheck className="w-4 h-4 text-primary-600" />
            Chọn bàn đặt trước của bạn
          </button>
          {confirmedReservations.length === 0 && !loadingRes && (
            <p className="text-xs text-stone-400 mt-2">
              Bạn chưa có đặt bàn nào được xác nhận.{' '}
              <Link to="/reservation" className="text-primary-600 font-bold hover:underline">Đặt bàn ngay</Link>
            </p>
          )}
        </div>
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

        {/* Voucher Section */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <label className="block text-sm font-semibold text-stone-700 mb-2">Mã Khuyến Mãi / Voucher</label>
          {voucherCode ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏷️</span>
                <div>
                  <div className="font-bold text-emerald-800 uppercase">{voucherCode}</div>
                  <div className="text-sm text-emerald-600 font-medium">Đã giảm {discountAmount.toLocaleString('vi-VN')}đ</div>
                </div>
              </div>
              <button 
                onClick={handleRemoveVoucher}
                className="p-2 text-stone-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"
                title="Gỡ mã giảm giá"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 sm:gap-3">
              <input 
                type="text"
                placeholder="Nhập mã..."
                value={inputVoucher}
                onChange={(e) => setInputVoucher(e.target.value)}
                className="w-[120px] sm:flex-1 px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 uppercase focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
              />
              <button 
                id="btn-apply-voucher"
                onClick={handleApplyVoucher}
                disabled={isApplyingVoucher || !inputVoucher.trim()}
                className="px-4 sm:px-6 py-3 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-300 text-white font-bold rounded-xl transition-colors whitespace-nowrap flex items-center justify-center min-w-[80px]"
              >
                {isApplyingVoucher ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Áp Dụng'}
              </button>
              <button 
                onClick={() => setIsVoucherModalOpen(true)}
                className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 border border-primary-200"
              >
                <Tag className="w-5 h-5" />
                <span className="hidden sm:inline">Chọn mã</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-stone-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-stone-900/10">
        <div className="mb-6 pb-6 border-b border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-500" />
              Khuyến mãi & Voucher
            </h3>
            {appliedVoucher ? (
              <p className="text-sm text-stone-400">
                Đã áp dụng mã <span className="font-bold text-primary-400">{appliedVoucher.code}</span>
              </p>
            ) : (
              <p className="text-sm text-stone-400">Chọn hoặc nhập mã khuyến mãi để được giảm giá</p>
            )}
          </div>
          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-sm font-bold transition-colors text-white whitespace-nowrap"
          >
            {appliedVoucher ? 'Thay đổi mã' : 'Chọn Voucher'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="w-full md:w-auto">
            <p className="text-stone-400 text-sm font-medium mb-1">Tổng cộng ({getTotalItems()} món)</p>
            {discountAmount > 0 && (
              <div className="flex items-center gap-2 text-sm text-primary-400 mb-1 font-bold">
                <span>Giảm giá:</span>
                <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
            <div className="text-3xl font-display font-bold">
              {Math.max(0, getTotalAmount() - discountAmount).toLocaleString('vi-VN')}
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
        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Chọn bàn ăn của bạn</h2>
              <p className="text-stone-500 text-sm mt-1">Vui lòng chọn số bàn bạn đang ngồi để nhà bếp phục vụ đúng vị trí</p>
            </div>
            <button onClick={() => setIsTableModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 bg-white rounded-full shadow-sm hover:shadow">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {tablesList.length === 0 ? (
              <div className="flex justify-center py-10 text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tablesList.map(t => {
                  const isSelected = tableId === t._id;
                  
                  return (
                    <button
                      key={t._id}
                      onClick={() => {
                        setTable(t._id);
                        setIsTableModalOpen(false);
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all p-3 ${
                        isSelected
                          ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md scale-105'
                          : 'bg-white border-stone-200 hover:border-primary-300 hover:shadow text-stone-700'
                      }`}
                    >
                      <span className="text-3xl font-black mb-1">{t.tableNumber}</span>
                      <span className="text-xs uppercase font-bold text-primary-600 mb-1">
                        Bàn {t.tableNumber}
                      </span>
                      <span className="text-[10px] text-stone-400 capitalize">
                        {t.capacity} chỗ | {t.area}
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

    {/* Voucher Modal */}
    <VoucherSelectorModal
      isOpen={isVoucherModalOpen}
      onClose={() => setIsVoucherModalOpen(false)}
      subTotal={getTotalAmount()}
      onApply={(voucher) => {
        setAppliedVoucher(voucher);
        setDiscountAmount(voucher.discountAmount);
        toast.success(`Áp dụng mã ${voucher.code} thành công!`);
      }}
    />
    </>
  );
};

export default CartPage;
