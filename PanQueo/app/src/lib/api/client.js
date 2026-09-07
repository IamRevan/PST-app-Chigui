import axios from "axios";
import { API_BASE_URL, TIMEOUT, STORAGE_KEYS } from "../utils/constants";
import { getItem } from "../utils/storage";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Error de conexión";
    return Promise.reject({ message, status: error.response?.status });
  },
);

export default apiClient;
