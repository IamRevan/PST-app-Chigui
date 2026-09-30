import { useData } from "./useData";
import { ENDPOINTS } from "../api/endpoints";

export const useReportesProduccion = (fechaInicio = null, fechaFin = null) => {
  let endpoint = ENDPOINTS.REPORTES_PRODUCCION;
  if (fechaInicio && fechaFin) {
    endpoint += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
  }
  return useData(endpoint, "@panqueo/cache_rep_prod", { initialData: [] });
};

export const useReportesMermas = () => {
  return useData(ENDPOINTS.REPORTES_MERMAS, "@panqueo/cache_rep_mermas", {
    initialData: [],
  });
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
