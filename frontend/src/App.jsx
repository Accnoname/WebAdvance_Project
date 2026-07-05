import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';

const App = () => {
  const { isAuthenticated } = useAuthStore();
  const fetchCart = useCartStore(state => state.fetchCart);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return <RouterProvider router={router} />;
};

export default App;
