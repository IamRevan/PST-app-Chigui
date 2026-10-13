import Constants from "expo-constants";

export const APP_NAME = "PanQueo";
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (__DEV__ ? "http://localhost:3000" : "https://api.panqueo.com");
export const TIMEOUT = 15000;

export const ESTADOS_PAGO = {
  PENDIENTE: "Pendiente",
  ABONADO: "Abonado",
  PAGADO: "Pagado",
};

export const ESTADOS_ENTREGA = {
  POR_PREPARAR: "Por Preparar",
  EN_COCINA: "En Cocina",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
};

export const ESTADOS_LISTA_COMPRA = {
  BORRADOR: "Borrador",
  EN_PROGRESO: "En Progreso",
  COMPLETADA: "Completada",
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "@panqueo/auth_token",
  USER_DATA: "@panqueo/user_data",
  OFFLINE_QUEUE: "@panqueo/offline_queue",
  LAST_SYNC: "@panqueo/last_sync",
};

export const ALERTA_VENCIMIENTO_DIAS = 7;
export const MARGEN_GANANCIA_MINIMO = 0.2;
export const ANOMALIA_CONSUMO_MAX = 0.2;
