import api from './api';

export const TableService = {
  getAll: async () => {
    const response = await api.get('/tables');
    return response;
  },
  
  create: async (data) => {
    const response = await api.post('/tables', data);
    return response;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.patch(`/tables/${id}/status`, { status });
    return response;
  }
};
