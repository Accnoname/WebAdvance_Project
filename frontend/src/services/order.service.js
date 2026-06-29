import api from './api';

const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (orderId, itemId, status) =>
    api.patch(`/orders/${orderId}/items/${itemId}/status`, { status }),
};

export default orderService;
