import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const usePedidos = () => {
  return useData(ENDPOINTS.PEDIDOS, "@panqueo/cache_pedidos", {
    initialData: [],
  });
};

export const usePedidoById = (id) => {
  return useData(
    id ? ENDPOINTS.PEDIDO_BY_ID(id) : null,
    `@panqueo/cache_pedido_${id}`,
    { initialData: null },
  );
};
