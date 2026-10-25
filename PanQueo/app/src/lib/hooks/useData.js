import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../api/client";
import { getItem, setItem } from "../utils/storage";

/**
 * Hook genérico para obtener datos de la API y cachearlos localmente.
 * Soporta Offline-first: si la API falla, carga la caché anterior.
 * Protegido contra ciclos de re-render ("Maximum update depth exceeded")
 * mediante useRef para estabilizar callbacks y opciones dinámicas.
 */
export const useData = (endpoint, cacheKey, options = {}) => {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Mantener opciones en un ref para evitar que objetos/funciones anónimas
  // pasadas en el render re-creen fetchData y provoquen bucles infinitos.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(
    async (background = false) => {
      if (!endpoint) {
        setLoading(false);
        return;
      }

      if (!background) setLoading(true);
      setError(null);
      setIsOffline(false);

      const opts = optionsRef.current || {};

      try {
        const response = await apiClient.get(endpoint);
        let responseData =
          response.data?.data !== undefined
            ? response.data.data
            : response.data;

        if (typeof opts.transform === "function") {
          responseData = opts.transform(responseData);
        } else if (responseData && !Array.isArray(responseData)) {
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
        if (cacheKey) {
          await setItem(cacheKey, responseData);
        }
      } catch (err) {
        console.warn(`Error fetching ${endpoint}:`, err.message);
        setIsOffline(true);
        if (!opts.silentFail) {
          setError(err.message || "Error de conexión");
        }

        // Intentar cargar de caché si falla la red
        if (cacheKey) {
          try {
            const cached = await getItem(cacheKey);
            if (cached) {
              setData(cached);
              setError(null);
            }
          } catch (cacheErr) {
            console.warn("Error reading cache:", cacheErr);
          }
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
