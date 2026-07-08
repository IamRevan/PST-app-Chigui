import axios from 'axios';
import { API_BASE_URL, TIMEOUT } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Error de conexión';
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default apiClient;
