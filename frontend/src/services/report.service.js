import api from './api';

const API_URL = '/reports';

export const ReportService = {
  getRevenue: async (params = {}) => {
    try {
      const response = await api.get(`${API_URL}/revenue`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBestSellers: async (params = {}) => {
    try {
      const response = await api.get(`${API_URL}/best-sellers`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get(`${API_URL}/dashboard`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
