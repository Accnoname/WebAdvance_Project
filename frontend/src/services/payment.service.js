import api from './api';

const paymentService = {
  createOffline: (data) => api.post('/payments', data),
  createVNPay: (orderId) => api.post('/payments/vnpay/create', { orderId }),
  getById: (id) => api.get(`/payments/${id}`),
};

export default paymentService;
