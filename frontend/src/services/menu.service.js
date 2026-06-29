import api from './api';

export const MenuService = {
  getAll: async (params) => {
    const response = await api.get('/menu', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },
  
  create: async (formData) => {
    const response = await api.post('/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  update: async (id, formData) => {
    const response = await api.put(`/menu/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },
  
  toggleAvailability: async (id) => {
    const response = await api.patch(`/menu/${id}/availability`);
    return response.data;
  }
};
