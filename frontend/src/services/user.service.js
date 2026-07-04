import api from './api';

export const UserService = {
  getStaff: async () => {
    const response = await api.get('/users/staff');
    return response;
  },

  createStaff: async (data) => {
    const response = await api.post('/users/staff', data);
    return response;
  },

  updateStaff: async (id, data) => {
    const response = await api.patch(`/users/staff/${id}`, data);
    return response;
  },

  deleteStaff: async (id) => {
    const response = await api.delete(`/users/staff/${id}`);
    return response;
  }
};
