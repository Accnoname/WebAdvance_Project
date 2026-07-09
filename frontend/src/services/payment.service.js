import api from './api';

const paymentService = {
  // Khách yêu cầu thanh toán tiền mặt
  createOffline: (data) => api.post('/payments', data),

  // Staff xác nhận đã thu tiền tại bàn
  confirmOffline: (orderId, method) => api.post(`/payments/${orderId}/confirm`, { method }),

  // Tạo link thanh toán VNPay
  createVNPay: (orderId) => api.post('/payments/vnpay/create', { orderId }),

  // Lấy thông tin payment theo ID
  getById: (id) => api.get(`/payments/${id}`),
};

export default paymentService;
