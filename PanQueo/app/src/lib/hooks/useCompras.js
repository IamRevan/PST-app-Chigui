import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useListasCompras = (estado = "Borrador") => {
  return useData(
    `${ENDPOINTS.LISTAS_COMPRAS}?estado=${estado}`,
    `@panqueo/cache_compras_${estado}`,
    { initialData: [] },
  );
};
