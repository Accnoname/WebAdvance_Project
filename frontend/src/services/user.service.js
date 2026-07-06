import api from './api';

export const UserService = {
  getAllUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response;
  },

  createStaff: async (data) => {
    const response = await api.post('/users', data);
    return response;
  },

  updateStaff: async (id, data) => {
    const response = await api.patch(`/users/${id}`, data);
    return response;
  },

  deleteStaff: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  }
};
