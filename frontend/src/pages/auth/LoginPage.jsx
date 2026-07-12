import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UtensilsCrossed } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-50 font-body">
      {/* Cột trái: Hình ảnh & Atmosphere */}
      <div className="md:w-1/2 relative flex items-center justify-center p-12 overflow-hidden bg-stone-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
        
        <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 backdrop-blur-sm border border-primary-500/30 mb-8">
            <UtensilsCrossed className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-amber-50 leading-tight mb-6 tracking-tight">
            Nơi tinh hoa <br/> ẩm thực hội tụ.
          </h1>
          <p className="text-stone-300 text-lg font-light leading-relaxed">
            Hệ thống quản lý nhà hàng thông minh, giúp bạn mang đến trải nghiệm tuyệt vời nhất cho thực khách.
          </p>
        </div>
      </div>

      {/* Cột phải: Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 sm:p-16 lg:p-24 bg-white relative">
        <div className="absolute top-0 right-0 p-8">
          <p className="text-sm text-stone-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="mb-10">
            <h2 className="font-display text-4xl text-stone-900 mb-2">Đăng Nhập</h2>
            <p className="text-stone-500">Chào mừng bạn quay trở lại với chúng tôi.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">Địa chỉ Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="name@example.com"
                  {...register('email', { 
                    required: 'Vui lòng nhập email',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' }
                  })}
                />
              </div>
              {errors.email && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-stone-700 block">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">Quên mật khẩu?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                  })}
                />
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
