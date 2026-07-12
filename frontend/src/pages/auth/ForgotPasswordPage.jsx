import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  // Lưu OTP + resetToken trả về từ server (chế độ test — xóa khi có email thật)
  const [sentData, setSentData] = useState(null);

  const onSubmit = async (data) => {
    try {
      const res = await authService.forgotPassword(data.email);
      const result = res.data?.data;
      setSentData(result);
      toast.success('Đã gửi mã OTP! Kiểm tra hộp thư của bạn.');
      // Chuyển sang trang đặt lại mật khẩu, truyền resetToken qua state
      navigate('/reset-password', {
        state: {
          resetToken: result?.resetToken,
          // chỉ dùng khi test — otp hiển thị trực tiếp
          otp: result?.otp,
        }
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể gửi mã OTP, vui lòng thử lại');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-50 font-body">
      {/* Cột trái: Atmosphere */}
      <div className="md:w-1/2 relative flex items-center justify-center p-12 overflow-hidden bg-stone-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent"></div>

        <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
          {/* Icon vòng tròn */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/25 mb-8 mx-auto">
            <KeyRound className="w-12 h-12 text-amber-400" />
          </div>
          <h1 className="font-display text-5xl text-amber-50 leading-tight mb-6 tracking-tight">
            Quên mật khẩu?
          </h1>
          <p className="text-stone-300 text-lg font-light leading-relaxed">
            Đừng lo lắng. Chúng tôi sẽ gửi mã xác thực đến email của bạn để đặt lại mật khẩu an toàn.
          </p>

          {/* Các bước hướng dẫn */}
          <div className="mt-10 space-y-4 text-left">
            {[
              { step: '01', text: 'Nhập địa chỉ email đã đăng ký' },
              { step: '02', text: 'Nhận mã OTP 6 số qua email' },
              { step: '03', text: 'Đặt lại mật khẩu mới của bạn' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <span className="text-amber-400 font-mono text-sm font-bold shrink-0">{step}</span>
                <div className="h-px flex-1 bg-stone-700"></div>
                <span className="text-stone-300 text-sm">{text}</span>
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
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-primary-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </div>

        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 mb-6">
              <KeyRound className="w-7 h-7 text-primary-600" />
            </div>
            <h2 className="font-display text-4xl text-stone-900 mb-2">Lấy lại mật khẩu</h2>
            <p className="text-stone-500 leading-relaxed">
              Nhập email bạn đã dùng để đăng ký. Mã OTP sẽ có hiệu lực trong <strong>15 phút</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">
                Địa chỉ Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="name@example.com"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' }
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <button
              id="forgot-password-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Gửi mã OTP</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-500">
            Nhớ ra mật khẩu rồi?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
