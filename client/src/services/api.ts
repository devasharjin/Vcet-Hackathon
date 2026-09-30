import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for deep AI merge analysis
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      message: error.message || 'Network request failed',
      code: 'NETWORK_ERROR',
    };
    return Promise.reject(errorData);
  }
);
