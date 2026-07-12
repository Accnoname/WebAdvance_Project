import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderService } from '../../services/order.service';
import paymentService from '../../services/payment.service';
import { useCartStore } from '../../store/cartStore';
import {
  Loader2, Receipt, ArrowLeft, CheckCircle2, CreditCard, Banknote, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Thử lấy đơn qua my-orders (với ownership check), fallback sang getById
      let res;
      try {
        res = await OrderService.getById(orderId);
      } catch {
        res = await OrderService.getMyOrders();
        const found = (res.data || []).find(o => o._id === orderId);
        if (found) {
          res = { success: true, data: found };
        } else {
          throw new Error('Không tìm thấy đơn hàng');
        }
      }
      if (res.success) {
        const orderData = res.data;
        // Nếu đơn đã thanh toán → redirect sang kết quả
        if (orderData.isPaid) {
          toast('Đơn hàng này đã được thanh toán', { icon: '✅' });
          navigate('/my-orders');
          return;
        }
        setOrder(orderData);
      }
    } catch (error) {
      toast.error('Không thể lấy thông tin đơn hàng');
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (paymentMethod === 'vnpay') {
        // Gọi API tạo URL VNPay — số tiền lấy từ finalAmount của đơn hàng
        const res = await paymentService.createVNPay(orderId);
        if (res.success && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          toast.error('Không thể tạo link thanh toán VNPay');
        }
      } else if (paymentMethod === 'tien_mat') {
        // Tiền mặt: gọi API tạo thanh toán offline cho nhân viên xử lý
        const res = await paymentService.createOffline({
          orderId,
          method: 'tien_mat'
        });
        if (res.success) {
          useCartStore.getState().clearCart();
          toast.success('Đơn hàng đã được ghi nhận! Nhân viên sẽ mang hóa đơn đến bàn của bạn.');
          navigate('/my-orders');
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) return null;

  // Dùng finalAmount (đã tính discount) nếu có, fallback totalAmount
  const payableAmount = (order.finalAmount != null && order.finalAmount !== undefined)
    ? order.finalAmount
    : order.totalAmount;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
      <button
        onClick={() => navigate('/my-orders')}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">

        {/* Header */}
        <div className="bg-stone-900 p-6 md:p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[#d4a85a] mb-1">Thanh Toán Đơn Hàng</h1>
          <p className="text-stone-400 text-sm">Mã đơn: #{order._id.slice(-6).toUpperCase()}</p>
          {order.table && (
            <p className="text-stone-400 text-sm mt-1">
              📍 Bàn {order.table?.tableNumber || '---'}
            </p>
          )}
        </div>

        <div className="p-6 md:p-8">
          {/* Chi tiết món */}
          <div className="mb-6">
            <h3 className="font-bold text-stone-800 mb-3 text-base">Chi tiết đơn hàng</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-stone-800">
                      {item.quantity} × {item.menuItem?.name || 'Món ăn'}
                    </div>
                    {item.note && (
                      <div className="text-xs text-stone-400 mt-0.5">Ghi chú: {item.note}</div>
                    )}
                  </div>
                  <div className="font-bold text-stone-700 ml-4">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng kết tiền */}
          <div className="bg-stone-50 rounded-2xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Tạm tính</span>
              <span>{order.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                <span>-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <span className="font-bold text-stone-800 text-base">Tổng thanh toán</span>
              <span className="text-2xl font-black font-display text-primary-600">
                {payableAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Chọn phương thức */}
          <div className="mb-6">
            <h3 className="font-bold text-stone-900 mb-4">Chọn phương thức thanh toán</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* VNPAY */}
              <button
                onClick={() => setPaymentMethod('vnpay')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  paymentMethod === 'vnpay'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-100 hover:border-stone-200 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${paymentMethod === 'vnpay' ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-sm ${paymentMethod === 'vnpay' ? 'text-primary-700' : 'text-stone-700'}`}>
                    Thanh toán VNPAY
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">Thẻ ATM, Visa, QR, MoMo, ZaloPay</div>
                </div>
                {paymentMethod === 'vnpay' && <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />}
              </button>

              {/* Tiền mặt */}
              <button
                onClick={() => setPaymentMethod('tien_mat')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  paymentMethod === 'tien_mat'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-100 hover:border-stone-200 bg-white'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${paymentMethod === 'tien_mat' ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-sm ${paymentMethod === 'tien_mat' ? 'text-primary-700' : 'text-stone-700'}`}>
                    Tiền mặt tại bàn
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">Nhân viên sẽ đến thu tiền tại chỗ</div>
                </div>
                {paymentMethod === 'tien_mat' && <CheckCircle2 className="w-5 h-5 text-primary-500 flex-shrink-0" />}
              </button>

            </div>
          </div>

          {/* Ghi chú khi chọn tiền mặt */}
          {paymentMethod === 'tien_mat' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
              <span className="font-bold">📋 Lưu ý:</span> Sau khi xác nhận, nhân viên sẽ đến bàn của bạn để thu tiền. Vui lòng chuẩn bị đúng số tiền.
            </div>
          )}

          {/* Nút thanh toán */}
          <button
            onClick={handlePayment}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : paymentMethod === 'vnpay' ? (
              <>
                <CreditCard className="w-5 h-5" />
                Thanh Toán {payableAmount.toLocaleString('vi-VN')}đ qua VNPAY
              </>
            ) : (
              <>
                <Banknote className="w-5 h-5" />
                Xác Nhận Thanh Toán Tiền Mặt
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-400 mt-4">
            Thanh toán trực tuyến được bảo mật bởi{' '}
            <span className="font-bold text-[#d4a85a]">VNPAY</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
