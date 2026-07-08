import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getItem, setItem, removeItem } from '../../lib/utils/storage';
import { STORAGE_KEYS } from '../../lib/utils/constants';

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
      const storedUser = await getItem(STORAGE_KEYS.USER_DATA);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch {
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

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated: !!token, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
