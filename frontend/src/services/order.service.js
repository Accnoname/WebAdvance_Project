import api from './api';

export const OrderService = {
  getAll: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  updateItemStatus: async (orderId, itemId, status) => {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
    return response.data;
  }
};
