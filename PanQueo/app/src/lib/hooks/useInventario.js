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
    { initialData: null },
  );
};

export const useAlertasInventario = () => {
  return useData(ENDPOINTS.INVENTARIO_ALERTAS, "@panqueo/cache_alertas_full", {
    initialData: { proximosAVencer: [], stockBajo: [], totalAlertas: 0 },
  });
};

export const useAlertasVencimiento = () => {
  return useData(ENDPOINTS.INVENTARIO_ALERTAS, "@panqueo/cache_alertas_venc", {
    initialData: [],
    transform: (res) => {
      if (Array.isArray(res)) return res;
      return res?.proximosAVencer || [];
    },
  });
};

export const useAlertasStockBajo = () => {
  return useData(ENDPOINTS.INVENTARIO_ALERTAS, "@panqueo/cache_alertas_stock", {
    initialData: [],
    transform: (res) => {
      if (Array.isArray(res)) return res;
      return res?.stockBajo || [];
    },
  });
};
