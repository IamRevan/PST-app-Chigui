import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getItem, setItem, removeItem } from "../lib/utils/storage";
import { STORAGE_KEYS } from "../lib/utils/constants";
import apiClient from "../lib/api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (storedToken) {
        // Configuramos el token localmente primero para el chequeo
        setToken(storedToken);

        // Verificamos vigencia con el backend
        const response = await apiClient.get("/api/auth/perfil", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        setUser(response.data.data);
        await setItem(STORAGE_KEYS.USER_DATA, response.data.data);
      }
    } catch (err) {
      console.warn("Sesión caducada o error de red en hydrate:", err.message);
      // Limpiamos si hay error 401
      if (err.status === 401) {
        setToken(null);
        setUser(null);
        await removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await removeItem(STORAGE_KEYS.USER_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (token, userData) => {
    setToken(token);
    setUser(userData);
    await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await setItem(STORAGE_KEYS.USER_DATA, userData);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await removeItem(STORAGE_KEYS.USER_DATA);
  }, []);

  const updateUser = useCallback(async (userData) => {
    setUser(userData);
    await setItem(STORAGE_KEYS.USER_DATA, userData);
  }, []);

  // Interceptor para desloguear si otra petición da 401
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.status === 401) {
          await logout();
        }
        return Promise.reject(error);
      },
    );
    return () => apiClient.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
