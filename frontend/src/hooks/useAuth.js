import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    // 1. Xóa giỏ hàng cũ trong bộ nhớ trước
    useCartStore.getState().clearLocalCart();
    // 2. Lưu thông tin auth mới
    setAuth(response.data.user, response.data.token);
    // 3. Tải giỏ hàng của tài khoản mới từ backend
    await useCartStore.getState().fetchCart();
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    useCartStore.getState().clearLocalCart();
    setAuth(response.data.user, response.data.token);
    await useCartStore.getState().fetchCart();
    return response;
  };

  const logout = () => {
    const userRole = user?.role;
    storeLogout();
    useCartStore.getState().clearLocalCart(); // Xóa giỏ hàng trên UI, không xóa DB
    toast.success('Đã đăng xuất');
    
    // Nếu là nhân viên hoặc quản lý thì chuyển về login để tiện đăng nhập phiên khác, khách hàng thì về trang chủ
    if (userRole === 'nhan_vien' || userRole === 'quan_ly') {
      navigate('/login');
    } else {
      navigate('/');
    }
  };

  return { user, token, login, register, logout, isAuthenticated: !!token };
};

export default useAuth;
