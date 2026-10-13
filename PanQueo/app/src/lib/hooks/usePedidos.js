import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const usePedidos = () => {
  return useData(ENDPOINTS.PEDIDOS, "@panqueo/cache_pedidos", {
    initialData: [],
  });
};
