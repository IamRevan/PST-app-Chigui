import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";
import { getItem, setItem } from "../utils/storage";

/**
 * Hook genérico para obtener datos de la API y cachearlos localmente.
 * Soporta Offline-first: si la API falla, carga la caché anterior.
 */
export const useData = (endpoint, cacheKey, options = {}) => {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = useCallback(
    async (background = false) => {
      if (!endpoint) {
        setLoading(false);
        return;
      }

      if (!background) setLoading(true);
      setError(null);
      setIsOffline(false);

      try {
        const response = await apiClient.get(endpoint);
        let responseData =
          response.data?.data !== undefined
            ? response.data.data
            : response.data;

        if (responseData && !Array.isArray(responseData)) {
          if (Array.isArray(responseData.pedidos)) {
            responseData = responseData.pedidos;
          } else if (Array.isArray(responseData.clientes)) {
            responseData = responseData.clientes;
          } else if (Array.isArray(responseData.ingredientes)) {
            responseData = responseData.ingredientes;
          } else if (Array.isArray(responseData.recetas)) {
            responseData = responseData.recetas;
          } else if (Array.isArray(responseData.listas)) {
            responseData = responseData.listas;
          } else if (Array.isArray(responseData.rows)) {
            responseData = responseData.rows;
          }
        }

        setData(responseData);
        await setItem(cacheKey, responseData);
      } catch (err) {
        console.warn(`Error fetching ${endpoint}:`, err.message);
        setIsOffline(true);
        if (!options.silentFail) {
          setError(err.message || "Error de conexión");
        }

        // Intentar cargar de caché si falla
        try {
          const cached = await getItem(cacheKey);
          if (cached) {
            setData(cached);
            setError(null); // Limpiamos el error si logramos cargar de caché
          }
        } catch (cacheErr) {
          console.warn("Error reading cache:", cacheErr);
        }
      } finally {
        if (!background) setLoading(false);
      }
    },
    [endpoint, cacheKey],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, isOffline, refetch: () => fetchData(false) };
};
