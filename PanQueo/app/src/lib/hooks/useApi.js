import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (config) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(config);
      return response.data;
    } catch (err) {
      setError(err.message || 'Error inesperado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(
    (url, params) => request({ method: 'GET', url, params }),
    [request]
  );
  const post = useCallback(
    (url, data) => request({ method: 'POST', url, data }),
    [request]
  );
  const patch = useCallback(
    (url, data) => request({ method: 'PATCH', url, data }),
    [request]
  );
  const del = useCallback(
    (url) => request({ method: 'DELETE', url }),
    [request]
  );

  return { loading, error, get, post, patch, del };
};
