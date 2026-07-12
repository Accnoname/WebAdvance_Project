import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Lấy resetToken và otp từ state khi chuyển trang từ ForgotPasswordPage
  const { resetToken, otp } = location.state || {};
  const newPassword = watch('newPassword');

  // Nếu không có resetToken → redirect về forgot-password
  useEffect(() => {
    if (!resetToken) {
      toast.error('Phiên làm việc không hợp lệ. Vui lòng thực hiện lại từ đầu.');
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  const onSubmit = async (data) => {
    try {
      await authService.resetPassword({
        resetToken,
        newPassword: data.newPassword,
      });
      toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại, vui lòng thử lại');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-50 font-body">
      {/* Cột trái: Atmosphere */}
      <div className="md:w-1/2 relative flex items-center justify-center p-12 overflow-hidden bg-stone-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-25"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/70 to-transparent"></div>

        <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/25 mb-8 mx-auto">
            <ShieldCheck className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="font-display text-5xl text-amber-50 leading-tight mb-6 tracking-tight">
            Đặt lại <br /> mật khẩu
          </h1>
          <p className="text-stone-300 text-lg font-light leading-relaxed">
            Chọn một mật khẩu mạnh để bảo vệ tài khoản của bạn. Mật khẩu phải có ít nhất 6 ký tự.
          </p>

          {/* Tips mật khẩu mạnh */}
          <div className="mt-10 bg-white/5 rounded-2xl p-6 text-left space-y-3 border border-white/10">
            <p className="text-amber-400 text-sm font-semibold mb-4">💡 Mẹo tạo mật khẩu mạnh</p>
            {[
              'Dùng ít nhất 8 ký tự',
              'Kết hợp chữ HOA và chữ thường',
              'Thêm số và ký tự đặc biệt (!@#$)',
              'Không dùng thông tin cá nhân',
            ].map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                <span className="text-stone-300 text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cột phải: Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 sm:p-16 lg:p-24 bg-white relative">
        {/* Nút quay lại */}
        <div className="absolute top-0 left-0 p-8">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-primary-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>

        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="font-display text-4xl text-stone-900 mb-2">Mật khẩu mới</h2>
            <p className="text-stone-500 leading-relaxed">
              Nhập mật khẩu mới cho tài khoản của bạn bên dưới.
            </p>
          </div>

          {/*  Banner OTP TEST MODE — xóa khi production */}
          {otp && (
            <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Chế độ TEST</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Mã OTP của bạn là: <strong className="text-amber-900 text-base font-mono tracking-widest">{otp}</strong>
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  (Chỉ hiển thị vì chưa có email server — xóa khi production)
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Mật khẩu mới */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">
                Mật khẩu mới
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="Nhập mật khẩu mới"
                  {...register('newPassword', {
                    required: 'Vui lòng nhập mật khẩu mới',
                    minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">
                Xác nhận mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (val) => val === newPassword || 'Mật khẩu xác nhận không khớp'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              id="reset-password-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Xác nhận đặt lại mật khẩu</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-500">
            Gặp sự cố?{' '}
            <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Gửi lại mã OTP
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
