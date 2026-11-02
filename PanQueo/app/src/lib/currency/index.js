import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AppState } from "react-native";
import { getItem, setItem } from "../utils/storage";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { STORAGE_KEYS } from "../utils/constants";
import { useAuth } from "../../auth/AuthContext";

/**
 * Contexto global de moneda bimonetaria PanQueo:
 * - Modos: 'dual' (muestra USD y Bs juntos), 'usd' ($), 'bs' (Bs. Digitales / VES)
 * - Tasa BCV obtenida de GET /api/finanzas/tasas/actual con persistencia offline.
 * - Permite registrar nueva tasa oficial vía POST /api/finanzas/tasas.
 */
const CurrencyContext = createContext(null);

export const MODES = ["dual", "usd", "bs"];
export const MODE_LABELS = {
  dual: "Dual (Bs / $)",
  usd: "Dólares ($)",
  bs: "Bolívares (Bs.)",
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("dual");
  const [tasa, setTasa] = useState(null); // valor_bs_por_usd
  const [tasaEur, setTasaEur] = useState(null); // valor_bs_por_eur
  // Tasa con la que se calculan los bolívares: 'usd' | 'eur'
  const [tasaBase, setTasaBaseState] = useState("usd");
  const [tasaMeta, setTasaMeta] = useState(null); // fuente, fecha valor, última sync

  /** Tasa activa para convertir a bolívares. */
  // Si la tasa elegida no está cargada aún, se usa la otra para no dejar los montos en cero.
  const tasaBaseEfectiva =
    tasaBase === "eur" && !Number.isFinite(parseFloat(tasaEur)) && Number.isFinite(parseFloat(tasa))
      ? "usd"
      : tasaBase === "usd" && !Number.isFinite(parseFloat(tasa)) && Number.isFinite(parseFloat(tasaEur))
        ? "eur"
        : tasaBase;
  const tasaTrabajo = useMemo(
    () => (tasaBaseEfectiva === "eur" ? tasaEur : tasa),
    [tasaBaseEfectiva, tasa, tasaEur],
  );
  const monedaTrabajo = tasaBaseEfectiva === "eur" ? "EUR" : "USD";

  const { isAuthenticated, token } = useAuth();

  const fetchTasa = useCallback(async () => {
    try {
      // Evita el 304 (ETag) de Express: si no, la respuesta llega sin cuerpo y la app queda "sin tasa".
      const res = await apiClient.get(ENDPOINTS.TASAS_ACTUAL, {
        params: { _: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = res.data?.data ?? res.data;
      const valor = data?.valor_bs_por_usd;
      // Respuesta vacía (p. ej. 304 sin cuerpo): se usa la caché local.
      if (valor == null && data?.valor_bs_por_eur == null) {
        throw new Error("Respuesta de tasas vacía");
      }
      if (valor != null && Number.isFinite(parseFloat(valor))) {
        const numValor = parseFloat(valor);
        setTasa(numValor);
        await setItem(STORAGE_KEYS.LAST_BCV_RATE, String(numValor));
      }
      const valorEur = data?.valor_bs_por_eur;
      if (valorEur != null && Number.isFinite(parseFloat(valorEur))) {
        const numEur = parseFloat(valorEur);
        setTasaEur(numEur);
        await setItem(STORAGE_KEYS.LAST_BCV_RATE_EUR, String(numEur));
      }
      setTasaMeta({
        fuente: data?.fuente_referencia || null,
        fechaValor: data?.fecha_valor || null,
        sincronizadoEn: data?.sincronizado_en || null,
        automatico: !!data?.automatico,
      });
    } catch {
      // Si la API falla, recuperar últimas tasas guardadas
      try {
        const cachedTasa = await getItem(STORAGE_KEYS.LAST_BCV_RATE);
        if (cachedTasa && Number.isFinite(parseFloat(cachedTasa))) {
          setTasa(parseFloat(cachedTasa));
        }
        const cachedEur = await getItem(STORAGE_KEYS.LAST_BCV_RATE_EUR);
        if (cachedEur && Number.isFinite(parseFloat(cachedEur))) {
          setTasaEur(parseFloat(cachedEur));
        }
      } catch {}
    }
  }, []);

  // Preferencias locales y últimas tasas guardadas (sirven sin conexión).
  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(STORAGE_KEYS.CURRENCY);
        if (stored === "dual" || stored === "usd" || stored === "bs") {
          setCurrency(stored);
        } else if (stored === "USD") {
          setCurrency("usd");
        } else if (stored === "Bs") {
          setCurrency("bs");
        }
      } catch {
        // default dual
      }

      try {
        const storedBase = await getItem(STORAGE_KEYS.TASA_BASE);
        if (storedBase === "eur" || storedBase === "usd") {
          setTasaBaseState(storedBase);
        }
      } catch {
        // default usd
      }

      try {
        const cachedTasa = await getItem(STORAGE_KEYS.LAST_BCV_RATE);
        if (cachedTasa && Number.isFinite(parseFloat(cachedTasa))) {
          setTasa(parseFloat(cachedTasa));
        }
        const cachedEur = await getItem(STORAGE_KEYS.LAST_BCV_RATE_EUR);
        if (cachedEur && Number.isFinite(parseFloat(cachedEur))) {
          setTasaEur(parseFloat(cachedEur));
        }
      } catch {
        // sin caché
      }
    })();
  }, []);

  // La tasa exige sesión iniciada: se pide al entrar, cada 10 min y al volver a la app.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    fetchTasa();
    const timer = setInterval(() => fetchTasa(), 10 * 60 * 1000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchTasa();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [isAuthenticated, token, fetchTasa]);

  const changeCurrency = useCallback(async (c) => {
    const val = c.toLowerCase();
    setCurrency(val);
    try {
      await setItem(STORAGE_KEYS.CURRENCY, val);
    } catch {}
  }, []);

  /** Elige la tasa con la que se calculan los bolívares (USD o EUR). */
  const setTasaBase = useCallback(
    async (base) => {
      if (base !== "usd" && base !== "eur") return;
      const disponible = base === "eur" ? tasaEur : tasa;
      if (!Number.isFinite(parseFloat(disponible))) {
        throw new Error(
          `La tasa del ${base === "eur" ? "euro" : "dólar"} todavía no está disponible`,
        );
      }
      setTasaBaseState(base);
      try {
        await setItem(STORAGE_KEYS.TASA_BASE, base);
      } catch {}
    },
    [tasa, tasaEur],
  );

  const toggleCurrency = useCallback(async () => {
    const currentIndex = MODES.indexOf(currency);
    const nextIndex = (currentIndex + 1) % MODES.length;
    const nextMode = MODES[nextIndex];
    await changeCurrency(nextMode);
    return nextMode;
  }, [currency, changeCurrency]);

  const registrarTasa = useCallback(
    async (nuevoValor, fuente = "BCV Oficial", nuevoValorEur = null) => {
      const num = parseFloat(nuevoValor);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error("El valor de la tasa debe ser un número positivo");
      }
      const eur = nuevoValorEur === null || nuevoValorEur === "" ? null : parseFloat(nuevoValorEur);
      if (eur !== null && (!Number.isFinite(eur) || eur <= 0)) {
        throw new Error("El valor de la tasa EUR debe ser un número positivo");
      }

      await apiClient.post(ENDPOINTS.TASAS, {
        valor_bs_por_usd: num,
        valor_bs_por_eur: eur,
        fuente_referencia: fuente,
      });

      setTasa(num);
      if (eur !== null) setTasaEur(eur);
      setTasaMeta({ fuente, fechaValor: null, sincronizadoEn: null, automatico: false });
      await setItem(STORAGE_KEYS.LAST_BCV_RATE, String(num));
      if (eur !== null) await setItem(STORAGE_KEYS.LAST_BCV_RATE_EUR, String(eur));
    },
    [],
  );

  /** Fuerza una sincronización contra el BCV (USD + EUR). */
  const sincronizarTasa = useCallback(async () => {
    const res = await apiClient.post(ENDPOINTS.TASAS_SINCRONIZAR, { forzar: true });
    const data = res.data?.data ?? res.data;

    const usd = parseFloat(data?.valor_bs_por_usd);
    if (Number.isFinite(usd)) {
      setTasa(usd);
      await setItem(STORAGE_KEYS.LAST_BCV_RATE, String(usd));
    }
    const eur = parseFloat(data?.valor_bs_por_eur);
    if (Number.isFinite(eur)) {
      setTasaEur(eur);
      await setItem(STORAGE_KEYS.LAST_BCV_RATE_EUR, String(eur));
    }
    setTasaMeta({
      fuente: data?.fuente_referencia || "BCV (auto)",
      fechaValor: data?.fecha_valor || null,
      sincronizadoEn: data?.sincronizado_en || new Date().toISOString(),
      automatico: true,
    });

    return { usd, eur, meta: res.data?.meta };
  }, []);

  const formatUSD = useCallback((usd) => {
    const val = parseFloat(usd);
    if (!Number.isFinite(val)) return "$0.00";
    return `$${val.toFixed(2)}`;
  }, []);

  const formatBs = useCallback(
    (usd) => {
      const val = parseFloat(usd);
      if (!Number.isFinite(val)) return "0.00 Bs.";
      const tasaActiva = parseFloat(tasaTrabajo);
      if (!Number.isFinite(tasaActiva) || tasaActiva <= 0) return `$${val.toFixed(2)} (sin tasa)`;
      const bs = val * tasaActiva;
      return `${bs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
    },
    [tasaTrabajo],
  );

  const formatDual = useCallback(
    (usd) => {
      const val = parseFloat(usd);
      if (!Number.isFinite(val)) return "—";
      const usdStr = `$${val.toFixed(2)}`;
      const tasaActiva = parseFloat(tasaTrabajo);
      if (!Number.isFinite(tasaActiva) || tasaActiva <= 0) return `${usdStr} (sin tasa)`;
      const bsStr = `${(val * tasaActiva).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
      return `${usdStr} · ${bsStr}`;
    },
    [tasaTrabajo],
  );

  const format = useCallback(
    (monto, options = {}) => {
      const { forceMode } = options;
      const activeMode = forceMode || currency;

      if (activeMode === "usd") {
        return formatUSD(monto);
      }
      if (activeMode === "bs") {
        return formatBs(monto);
      }
      return formatDual(monto);
    },
    [currency, formatUSD, formatBs, formatDual],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        mode: currency,
        tasa,
        tasaEur,
        tasaBase,
        tasaTrabajo,
        monedaTrabajo,
        tasaMeta,
        setCurrency: changeCurrency,
        setTasaBase,
        toggleCurrency,
        registrarTasa,
        sincronizarTasa,
        refreshTasa: fetchTasa,
        format,
        formatUSD,
        formatBs,
        formatDual,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  return (
    ctx || {
      currency: "dual",
      mode: "dual",
      tasa: null,
      tasaEur: null,
      tasaBase: "usd",
      tasaTrabajo: null,
      monedaTrabajo: "USD",
      tasaMeta: null,
      setCurrency: () => {},
      setTasaBase: async () => {},
      toggleCurrency: () => {},
      registrarTasa: async () => {},
      sincronizarTasa: async () => ({ usd: null, eur: null }),
      refreshTasa: () => {},
      format: (monto) => {
        const val = parseFloat(monto);
        return Number.isFinite(val) ? `$${val.toFixed(2)}` : "—";
      },
      formatUSD: (monto) => `$${(parseFloat(monto) || 0).toFixed(2)}`,
      formatBs: (monto) => `${(parseFloat(monto) || 0).toFixed(2)} Bs.`,
      formatDual: (monto) => `$${(parseFloat(monto) || 0).toFixed(2)}`,
    }
  );
};
