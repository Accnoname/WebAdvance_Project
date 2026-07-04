import api from './api';

export const ReservationService = {
  create: async (data) => {
    const response = await api.post('/reservations', data);
    return response;
  },

  getAll: async (params) => {
    const response = await api.get('/reservations', { params });
    return response;
  },

  updateStatus: async (id, status, tableId = null) => {
    const response = await api.patch(`/reservations/${id}/status`, { status, tableId });
    return response;
  }
};
