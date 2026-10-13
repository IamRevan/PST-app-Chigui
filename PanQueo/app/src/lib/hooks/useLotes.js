import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useLotesByIngrediente = (idIngrediente) => {
  return useData(
    `${ENDPOINTS.LOTES}?id_ingrediente=${idIngrediente}`,
    `@panqueo/cache_lotes_${idIngrediente}`,
    { initialData: [] },
  );
};
