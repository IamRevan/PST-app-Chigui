import Constants from "expo-constants";
import { Platform } from "react-native";

export const APP_NAME = "PanQueo";

/**
 * Resuelve la URL base de la API automáticamente según el entorno:
 * 1. Web: usa el hostname del navegador o localhost.
 * 2. Dispositivo físico / Expo Go: usa la IP del host de Metro Bundler.
 * 3. Emulador Android: usa el alias 10.0.2.2 hacia el host de desarrollo.
 * 4. Fallback: extra.apiUrl o localhost:3000.
 */
export const getDefaultApiUrl = () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.hostname) {
      return `http://${window.location.hostname}:3000`;
    }
    return "http://localhost:3000";
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:3000`;
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return (
    Constants.expoConfig?.extra?.apiUrl ||
    (__DEV__ ? "http://localhost:3000" : "https://api.panqueo.com")
  );
};

export const API_BASE_URL = getDefaultApiUrl();
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
  CURRENCY: "@panqueo/currency",
  API_URL: "@panqueo/api_url",
  THEME_MODE: "@panqueo/theme_mode",
  LAST_BCV_RATE: "@panqueo/last_bcv_rate",
};

export const ALERTA_VENCIMIENTO_DIAS = 7;
export const MARGEN_GANANCIA_MINIMO = 0.2;
export const ANOMALIA_CONSUMO_MAX = 0.2;
