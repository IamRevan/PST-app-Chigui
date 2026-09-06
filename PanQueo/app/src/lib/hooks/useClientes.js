import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useClientes = () => {
  return useData(ENDPOINTS.CLIENTES, "@panqueo/cache_clientes", {
    initialData: [],
  });
};

export const useClienteById = (id) => {
  return useData(
    id ? ENDPOINTS.CLIENTE_BY_ID(id) : null,
    `@panqueo/cache_cliente_${id}`,
    { initialData: null }
  );
};

export const useClienteHistorial = (id) => {
  return useData(
    id ? ENDPOINTS.CLIENTE_HISTORIAL(id) : null,
    `@panqueo/cache_cliente_historial_${id}`,
    { initialData: [] }
  );
};
