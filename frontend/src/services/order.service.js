import api from './api';

export const OrderService = {
  getAll: async (params) => {
    const response = await api.get('/orders', { params });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response;
  },

  create: async (data) => {
    const response = await api.post('/orders', data);
    return response;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response;
  },

  updateItemStatus: async (orderId, itemId, status) => {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
    return response;
  }
};
