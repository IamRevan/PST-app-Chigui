import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useReportesProduccion = (fechaInicio = null, fechaFin = null) => {
  let endpoint = ENDPOINTS.REPORTES_PRODUCCION;
  if (fechaInicio && fechaFin) {
    endpoint += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
  }
  return useData(endpoint, "@panqueo/cache_rep_prod", {
    initialData: { totalProducido: 0, producidosPorReceta: {}, pedidos: [] },
  });
};

export const useReportesMermas = () => {
  return useData(ENDPOINTS.REPORTES_MERMAS, "@panqueo/cache_rep_mermas", {
    initialData: { totalLotesVencidos: 0, mermaTotal: 0, mermaValorEstimado: 0, lotes: [] },
  });
};

export const useReportesTrazabilidad = (limit = 50) => {
  return useData(
    `${ENDPOINTS.REPORTES_TRAZABILIDAD}?limit=${limit}`,
    "@panqueo/cache_rep_trazabilidad",
    {
      initialData: { totalRegistros: 0, totalConsumido: 0, violacionesFEFO: 0, registros: [] },
    },
  );
};

export const useReportesBalance = (fechaInicio = null, fechaFin = null) => {
  let endpoint = ENDPOINTS.REPORTES_BALANCE;
  if (fechaInicio && fechaFin) {
    endpoint += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
  }
  return useData(endpoint, "@panqueo/cache_rep_balance", {
    initialData: { total_ingresos: 0, total_pendientes: 0, desglose: [] },
  });
};
