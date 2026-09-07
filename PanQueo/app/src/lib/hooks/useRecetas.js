import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useRecetas = () => {
  return useData(ENDPOINTS.RECETAS, "@panqueo/cache_recetas", {
    initialData: [],
  });
};
