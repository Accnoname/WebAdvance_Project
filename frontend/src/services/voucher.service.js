import api from './api';

const API_URL = '/vouchers';

export const VoucherService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get(API_URL, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post(API_URL, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  validate: async (code, orderAmount) => {
    try {
      const response = await api.post(`${API_URL}/validate`, { code, orderAmount });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getAvailableVouchers: async () => {
    try {
      const response = await api.get(`${API_URL}/client/available`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};
