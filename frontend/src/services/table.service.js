import api from './api';

export const TableService = {
  getAll: async () => {
    const response = await api.get('/tables');
    return response;
  },
  
  // Kiểm tra tình trạng bàn theo ngày/giờ đặt trước
  checkAvailability: async (date, time) => {
    const response = await api.get('/tables/availability', { params: { date, time } });
    return response;
  },
  
  create: async (data) => {
    const response = await api.post('/tables', data);
    return response;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.patch(`/tables/${id}/status`, { status });
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response;
  }
};

