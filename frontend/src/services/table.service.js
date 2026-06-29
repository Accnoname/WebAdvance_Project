import api from './api';

const tableService = {
  getAll: () => api.get('/tables'),
  getById: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  updateStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
};

export default tableService;
