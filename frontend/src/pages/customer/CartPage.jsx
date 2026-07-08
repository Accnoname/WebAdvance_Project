import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';
import { Trash2, Plus, Minus, ArrowRight, Loader2, Store, Truck, X, CalendarCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const CartPage = () => {
  const { user } = useAuth();
  const {
    items, tableId, orderType, deliveryAddress, deliveryPhone,
    setTable, setOrderType, setDeliveryInfo, updateQuantity,
    updateNote, removeItem, clearCart, getTotalAmount, getTotalItems
  } = useCartStore();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Chỉ lấy những reservation đã được xác nhận (da_xac_nhan) và có bàn
  const fetchReservations = async () => {
    if (!user) return;
    setLoadingRes(true);
    try {
      const res = await ReservationService.getMyReservations();
      if (res.success) {
        const confirmed = (res.data || []).filter(
          r => r.status === 'da_xac_nhan' && r.table
        );
        setConfirmedReservations(confirmed);
      }
    } catch (error) {
      console.error('Lỗi tải đặt bàn:', error);
    } finally {
      setLoadingRes(false);
    }
  };

  useEffect(() => {
    if (user && orderType === 'tai_ban') {
      fetchReservations();
    }
  }, [user, orderType]);

  const handleSelectTableClick = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chọn bàn!');
      navigate('/login');
      return;
    }
    setIsTableModalOpen(true);
  };

  // Tên bàn đang chọn để hiển thị
  const selectedReservation = confirmedReservations.find(
    r => r.table?._id === tableId || r.table === tableId
  );
  const getSelectedTableDisplay = () => {
    if (!tableId) return null;
    if (selectedReservation) {
      return `Bàn ${selectedReservation.table?.tableNumber} (Đặt trước)`;
    }
    return `Bàn đã chọn`;
  };

  // Đặt món → tạo order → chuyển sang trang thanh toán
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt món!');
      navigate('/login');
      return;
    }
    if (isSubmitting) return;
    if (orderType === 'tai_ban' && !tableId) {
      toast.error('Vui lòng chọn bàn đặt trước của bạn!');
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
        tableId: orderType === 'tai_ban'
          ? (typeof tableId === 'object' ? tableId?._id : tableId)
          : undefined,
        deliveryAddress: orderType === 'giao_hang' ? deliveryAddress : undefined,
        deliveryPhone: orderType === 'giao_hang' ? deliveryPhone : undefined,
        items: items.map(i => ({
          menuItemId: i.menuItem._id,
          quantity: i.quantity,
          note: i.note
        })),
        note: orderNote
      };

      const res = await OrderService.create(payload);
      if (res.success) {
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

      {/* Thông tin đặt món */}
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

      {/* Danh sách món */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 mb-8">
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={`${item.menuItem._id}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-stone-100 last:border-0 last:pb-0">
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
                  onChange={(e) => updateNote(item.menuItem._id, item.note, e.target.value)}
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
                  onClick={() => removeItem(item.menuItem._id, item.note)}
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

      {/* Tổng kết + Đặt món */}
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
                Tiến Hành Thanh Toán
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    {/* Modal chọn bàn đặt trước */}
    {isTableModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Bàn đặt trước của bạn</h2>
              <p className="text-stone-500 text-sm mt-1">Chọn bàn bạn đã đặt trước và được xác nhận</p>
            </div>
            <button onClick={() => setIsTableModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 bg-white rounded-full shadow-sm hover:shadow">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loadingRes ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : confirmedReservations.length === 0 ? (
              <div className="text-center py-10">
                <CalendarCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500 font-medium mb-1">Không có đặt bàn nào được xác nhận</p>
                <p className="text-stone-400 text-sm mb-4">Bạn cần đặt bàn trước và được nhà hàng xác nhận mới có thể chọn</p>
                <Link
                  to="/reservation"
                  onClick={() => setIsTableModalOpen(false)}
                  className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors"
                >
                  Đặt bàn ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedReservations.map(r => {
                  const isSelected = tableId === r.table?._id;
                  const resDate = new Date(r.reservationDate).toLocaleDateString('vi-VN');
                  return (
                    <button
                      key={r._id}
                      onClick={() => {
                        setTable(r.table?._id);
                        setIsTableModalOpen(false);
                      }}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-stone-100 bg-white hover:border-primary-300 hover:bg-stone-50'
                      }`}
                    >
                      {/* Số bàn */}
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 ${
                        isSelected ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {r.table?.tableNumber}
                      </div>
                      {/* Thông tin */}
                      <div className="flex-1">
                        <div className={`font-bold text-base ${isSelected ? 'text-primary-700' : 'text-stone-800'}`}>
                          Bàn {r.table?.tableNumber}
                          {r.table?.area && <span className="ml-2 text-xs font-medium text-stone-400 uppercase">{r.table.area}</span>}
                        </div>
                        <div className="text-sm text-stone-500 mt-0.5">
                          📅 {resDate} lúc {r.reservationTime} · {r.partySize} người
                        </div>
                        <div className="text-xs mt-1">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                            ✓ Đã xác nhận
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-black">✓</span>
                        </div>
                      )}
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
