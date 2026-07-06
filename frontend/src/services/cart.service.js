import api from './api';

export const CartService = {
  getCart: async () => {
    const res = await api.get('/cart');
    return res;
  },
  syncCart: async (cartData) => {
    const res = await api.put('/cart/sync', cartData);
    return res;
  },
  clearCart: async () => {
    const res = await api.delete('/cart');
    return res;
  }
};
