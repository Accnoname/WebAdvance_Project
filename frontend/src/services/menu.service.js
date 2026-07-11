import api from './api';

export const MenuService = {
  getAll: async (params) => {
    const response = await api.get('/menu', { params });
    return response;
  },
  
  getById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response;
  },
  
  create: async (formData) => {
    const response = await api.post('/menu', formData);
    return response;
  },
  
  update: async (id, formData) => {
    const response = await api.put(`/menu/${id}`, formData);
    return response;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response;
  },
  
  toggleAvailability: async (id) => {
    const response = await api.patch(`/menu/${id}/availability`);
    return response;
  }
};
