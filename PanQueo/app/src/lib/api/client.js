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
    // Soporte para URL configurada dinámicamente por el usuario en Configuración
    const customUrl = await getItem(STORAGE_KEYS.API_URL);
    const base = (customUrl && typeof customUrl === "string" && customUrl.trim())
      ? customUrl.trim().replace(/\/+$/, "")
      : API_BASE_URL.replace(/\/+$/, "");

    config.baseURL = base;

    // Normalizar duplicación de prefijo /api si base ya lo incluye
    if (config.url) {
      if (base.endsWith("/api") && config.url.startsWith("/api/")) {
        config.url = config.url.replace(/^\/api/, "");
      }
    }

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
    let message = error.response?.data?.message;
    if (!message) {
      if (error.code === "ECONNABORTED") {
        message = "Tiempo de espera agotado. Revisa tu conexión.";
      } else if (error.message === "Network Error") {
        message = "Error de red: no se pudo conectar con el servidor.";
      } else {
        message = error.message || "Error de conexión";
      }
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

export default apiClient;
