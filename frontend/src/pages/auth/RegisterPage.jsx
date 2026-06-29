import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, UtensilsCrossed } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  // Watch password for confirm password validation
  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      // The authStore logic usually logs the user in after registration
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
      });
      toast.success('Đăng ký tài khoản thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-50 font-body">
      {/* Cột trái: Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 sm:p-16 lg:p-24 bg-white relative order-2 md:order-1 overflow-y-auto">
        <div className="absolute top-0 left-0 p-8">
          <p className="text-sm text-stone-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        <div className="w-full max-w-md animate-fade-in-up mt-12 md:mt-0" style={{ animationDelay: '100ms' }}>
          <div className="mb-10">
            <h2 className="font-display text-4xl text-stone-900 mb-2">Trở thành Hội viên</h2>
            <p className="text-stone-500">Tạo tài khoản để nhận những ưu đãi đặc quyền.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">Họ và tên</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="Nguyễn Văn A"
                  {...register('name', { required: 'Vui lòng nhập họ tên' })}
                />
              </div>
              {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">Số điện thoại</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="tel"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="0912 345 678"
                  {...register('phone', { 
                    required: 'Vui lòng nhập số điện thoại',
                    pattern: { value: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                  })}
                />
              </div>
              {errors.phone && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.phone.message}</p>}
            </div>

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

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 block">Mật khẩu</label>
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
                      minLength: { value: 6, message: 'Ít nhất 6 ký tự' }
                    })}
                  />
                </div>
                {errors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 block">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="••••••••"
                    {...register('confirmPassword', { 
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: value => value === password || "Mật khẩu không khớp"
                    })}
                  />
                </div>
                {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 mt-6"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Hoàn Tất Đăng Ký</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Cột phải: Hình ảnh & Atmosphere */}
      <div className="md:w-1/2 relative flex items-center justify-center p-12 overflow-hidden bg-stone-900 order-1 md:order-2 min-h-[40vh] md:min-h-screen">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
        
        <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 backdrop-blur-sm border border-primary-500/30 mb-8 mx-auto">
            <UtensilsCrossed className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-amber-50 leading-tight mb-4 tracking-tight">
            Khám phá hương vị <br/> đích thực.
          </h1>
          <p className="text-stone-300 text-base md:text-lg font-light leading-relaxed">
            Đăng ký để nhận thông báo về món mới, đặt bàn nhanh chóng và lưu lại những món ăn yêu thích của bạn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
