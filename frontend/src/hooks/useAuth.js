import { useAuthStore } from '../store/authStore';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

const useAuth = () => {
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    setAuth(response.data.user, response.data.token);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setAuth(response.data.user, response.data.token);
    return response;
  };

  const logout = () => {
    storeLogout();
    toast.success('Đã đăng xuất');
  };

  return { user, token, login, register, logout, isAuthenticated: !!token };
};

export default useAuth;
