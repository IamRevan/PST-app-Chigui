import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useLotesByIngrediente = (idIngrediente) => {
  // Sin id: sin datos (evita GET con "?id_ingrediente=undefined")
  return useData(
    idIngrediente ? `${ENDPOINTS.LOTES}?id_ingrediente=${idIngrediente}` : null,
    `@panqueo/cache_lotes_${idIngrediente}`,
    { initialData: [] },
  );
};
