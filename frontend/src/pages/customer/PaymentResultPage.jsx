import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Home, ShoppingBag, ArrowRight, Receipt } from 'lucide-react';

// ─── Mã phản hồi VNPay → mô tả tiếng Việt ───────────────────────────────────
const VNPAY_RESPONSE_MESSAGES = {
  '00': 'Giao dịch thành công',
  '07': 'Giao dịch bị nghi ngờ (liên quan đến lừa đảo, giao dịch bất thường)',
  '09': 'Thẻ/Tài khoản chưa đăng ký InternetBanking',
  '10': 'Xác thực thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Sai mật khẩu xác thực OTP',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi không xác định',
};

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(8);

  const isSuccess = searchParams.get('success') === 'true';
  const responseCode = searchParams.get('code') || '99';
  const orderId = searchParams.get('orderId') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  const message = VNPAY_RESPONSE_MESSAGES[responseCode] || 'Giao dịch không xác định';
  const shortOrderId = orderId ? orderId.slice(-6).toUpperCase() : '------';

  // Tự động chuyển về /my-orders sau 8 giây nếu thành công
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/my-orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-[#0f0a05] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-fade-in-up">

        {/* ─── Card chính ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header gradient */}
          <div className={`px-8 pt-10 pb-8 text-center ${isSuccess ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-gradient-to-br from-red-50 to-rose-50'}`}>
            {/* Icon vòng tròn */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg ${
              isSuccess
                ? 'bg-emerald-100 shadow-emerald-200'
                : 'bg-red-100 shadow-red-200'
            }`}>
              {isSuccess
                ? <CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={1.5} />
                : <XCircle className="w-12 h-12 text-red-500" strokeWidth={1.5} />
              }
            </div>

            <h1 className={`text-2xl font-display font-black mb-2 ${isSuccess ? 'text-emerald-800' : 'text-red-700'}`}>
              {isSuccess ? 'Thanh Toán Thành Công!' : 'Thanh Toán Thất Bại'}
            </h1>
            <p className="text-stone-500 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Thông tin giao dịch */}
          <div className="px-8 py-6 space-y-3 border-b border-stone-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500 font-medium">Mã đơn hàng</span>
              <span className="font-bold text-stone-800 font-mono tracking-wider">#{shortOrderId}</span>
            </div>

            {amount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500 font-medium">Số tiền</span>
                <span className={`font-black text-lg ${isSuccess ? 'text-emerald-600' : 'text-stone-700'}`}>
                  {amount.toLocaleString('vi-VN')}₫
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500 font-medium">Phương thức</span>
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">VNPAY</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500 font-medium">Mã kết quả</span>
              <span className={`font-mono text-xs px-2.5 py-1 rounded-lg font-bold ${
                isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {responseCode}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 space-y-3">
            {isSuccess ? (
              <>
                <Link
                  to="/my-orders"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                >
                  <Receipt className="w-5 h-5" />
                  Xem Đơn Hàng Của Tôi
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/menu"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-stone-200 hover:border-stone-300 text-stone-700 rounded-2xl font-bold transition-all hover:bg-stone-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Tiếp Tục Mua Sắm
                </Link>

                {/* Countdown */}
                <p className="text-center text-xs text-stone-400 pt-1">
                  Tự động chuyển tới đơn hàng sau{' '}
                  <span className="font-bold text-[#d4a85a]">{countdown}s</span>
                </p>
              </>
            ) : (
              <>
                {orderId && (
                  <Link
                    to={`/payment/${orderId}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#d4a85a] hover:bg-[#c4973f] text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#d4a85a]/30"
                  >
                    Thử Thanh Toán Lại
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-stone-200 hover:border-stone-300 text-stone-700 rounded-2xl font-bold transition-all hover:bg-stone-50"
                >
                  <Home className="w-4 h-4" />
                  Về Trang Chủ
                </Link>

                {/* Gợi ý hỗ trợ */}
                <p className="text-center text-xs text-stone-400 pt-1">
                  Cần hỗ trợ? Liên hệ{' '}
                  <span className="font-bold text-stone-600">nhân viên tại quầy</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Logo nhỏ phía dưới */}
        <div className="text-center mt-6">
          <p className="text-stone-600 text-xs">
            Thanh toán bảo mật qua{' '}
            <span className="font-bold text-[#d4a85a]">VNPAY</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default PaymentResultPage;
