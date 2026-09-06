import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useInventario = () => {
  return useData(ENDPOINTS.INVENTARIO, "@panqueo/cache_inventario", {
    initialData: [],
  });
};

export const useIngredienteById = (id) => {
  return useData(
    id ? ENDPOINTS.INVENTARIO_BY_ID(id) : null,
    `@panqueo/cache_inventario_${id}`,
    { initialData: null }
  );
};

export const useAlertasVencimiento = () => {
  return useData(ENDPOINTS.INVENTARIO_ALERTAS, "@panqueo/cache_alertas", {
    initialData: [],
  });
};
