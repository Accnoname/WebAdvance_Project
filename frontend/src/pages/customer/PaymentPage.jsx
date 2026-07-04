import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderService } from '../../services/order.service';
import paymentService from '../../services/payment.service';
import { Loader2, Receipt, ArrowLeft, CheckCircle2, Ticket, CreditCard, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await OrderService.getById(orderId);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (error) {
      toast.error('Không thể lấy thông tin đơn hàng');
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = () => {
    if (!voucherCode) return;
    // Tương lai: Gọi API kiểm tra Voucher
    if (voucherCode === 'GIAM10K') {
      setDiscount(10000);
      toast.success('Áp dụng mã giảm giá thành công!');
    } else {
      toast.error('Mã giảm giá không hợp lệ!');
      setDiscount(0);
    }
  };

  const handlePayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (paymentMethod === 'tien_mat') {
        const res = await paymentService.createOffline({
          orderId,
          method: 'tien_mat'
        });
        if (res.success) {
          toast.success('Đã gửi yêu cầu thanh toán tiền mặt. Nhân viên sẽ đến hỗ trợ bạn ngay.');
          navigate('/my-orders');
        }
      } else if (paymentMethod === 'vnpay') {
        const res = await paymentService.createVNPay(orderId);
        if (res.success && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl; // Chuyển hướng sang VNPay
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
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

  const finalAmount = Math.max(0, order.totalAmount - discount);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
      <button 
        onClick={() => navigate('/my-orders')}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        {/* Header Hóa Đơn */}
        <div className="bg-stone-900 p-6 md:p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[#d4a85a] mb-1">Hóa Đơn Của Bạn</h1>
          <p className="text-stone-400">Đơn hàng #{order._id.slice(-6).toUpperCase()}</p>
        </div>

        {/* Chi tiết Hóa Đơn */}
        <div className="p-6 md:p-8">
          <div className="space-y-4 mb-8">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0">
                <div className="flex-1">
                  <div className="font-bold text-stone-900">
                    {item.quantity} x {item.menuItem?.name || 'Món ăn'}
                  </div>
                  {item.note && <div className="text-xs text-stone-500 mt-1">Ghi chú: {item.note}</div>}
                </div>
                <div className="font-bold text-stone-700">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </div>
              </div>
            ))}
          </div>

          {/* Nhập Voucher */}
          <div className="mb-8 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex gap-3">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Nhập mã giảm giá (VD: GIAM10K)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-bold text-stone-700"
              />
            </div>
            <button
              onClick={handleApplyVoucher}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors"
            >
              Áp dụng
            </button>
          </div>

          {/* Tổng kết */}
          <div className="space-y-3 mb-8 text-right">
            <div className="flex justify-between text-stone-500 font-medium">
              <span>Tạm tính:</span>
              <span>{order.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-bold">
                <span>Giảm giá:</span>
                <span>-{discount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4 border-t border-stone-100">
              <span className="text-stone-800 font-bold text-lg">Tổng Thanh Toán:</span>
              <span className="text-3xl font-display font-black text-primary-600">
                {finalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Chọn phương thức thanh toán */}
          <div className="mb-8">
            <h3 className="font-bold text-stone-900 mb-4 text-lg">Chọn phương thức thanh toán</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('vnpay')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'vnpay' ? 'border-primary-500 bg-primary-50' : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'vnpay' ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className={`font-bold ${paymentMethod === 'vnpay' ? 'text-primary-700' : 'text-stone-700'}`}>Thanh toán VNPay</div>
                  <div className="text-xs text-stone-500">Thẻ ATM, Visa, Momo, ZaloPay</div>
                </div>
                {paymentMethod === 'vnpay' && <CheckCircle2 className="w-5 h-5 text-primary-500 ml-auto" />}
              </button>

              <button
                onClick={() => setPaymentMethod('tien_mat')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'tien_mat' ? 'border-primary-500 bg-primary-50' : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMethod === 'tien_mat' ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className={`font-bold ${paymentMethod === 'tien_mat' ? 'text-primary-700' : 'text-stone-700'}`}>Tiền mặt tại quầy</div>
                  <div className="text-xs text-stone-500">Thanh toán cho nhân viên</div>
                </div>
                {paymentMethod === 'tien_mat' && <CheckCircle2 className="w-5 h-5 text-primary-500 ml-auto" />}
              </button>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Xác Nhận & Thanh Toán'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
