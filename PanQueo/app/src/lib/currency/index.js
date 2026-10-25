import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getItem, setItem } from "../utils/storage";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { STORAGE_KEYS } from "../utils/constants";

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

  const fetchTasa = useCallback(async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.TASAS_ACTUAL);
      const data = res.data?.data ?? res.data;
      const valor = data?.valor_bs_por_usd;
      if (valor != null && Number.isFinite(parseFloat(valor))) {
        const numValor = parseFloat(valor);
        setTasa(numValor);
        await setItem(STORAGE_KEYS.LAST_BCV_RATE, String(numValor));
      }
    } catch {
      // Si la API falla, recuperar última tasa guardada
      try {
        const cachedTasa = await getItem(STORAGE_KEYS.LAST_BCV_RATE);
        if (cachedTasa && Number.isFinite(parseFloat(cachedTasa))) {
          setTasa(parseFloat(cachedTasa));
        }
      } catch {}
    }
  }, []);

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
    })();

    fetchTasa();
  }, [fetchTasa]);

  const changeCurrency = useCallback(async (c) => {
    const val = c.toLowerCase();
    setCurrency(val);
    try {
      await setItem(STORAGE_KEYS.CURRENCY, val);
    } catch {}
  }, []);

  const toggleCurrency = useCallback(async () => {
    const currentIndex = MODES.indexOf(currency);
    const nextIndex = (currentIndex + 1) % MODES.length;
    const nextMode = MODES[nextIndex];
    await changeCurrency(nextMode);
    return nextMode;
  }, [currency, changeCurrency]);

  const registrarTasa = useCallback(
    async (nuevoValor, fuente = "BCV Oficial") => {
      const num = parseFloat(nuevoValor);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error("El valor de la tasa debe ser un número positivo");
      }

      await apiClient.post(ENDPOINTS.TASAS, {
        valor_bs_por_usd: num,
        fuente,
      });

      setTasa(num);
      await setItem(STORAGE_KEYS.LAST_BCV_RATE, String(num));
    },
    [],
  );

  const formatUSD = useCallback((usd) => {
    const val = parseFloat(usd);
    if (!Number.isFinite(val)) return "$0.00";
    return `$${val.toFixed(2)}`;
  }, []);

  const formatBs = useCallback(
    (usd) => {
      const val = parseFloat(usd);
      if (!Number.isFinite(val)) return "0.00 Bs.";
      if (!tasa) return `$${val.toFixed(2)} (sin tasa)`;
      const bs = val * tasa;
      return `${bs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
    },
    [tasa],
  );

  const formatDual = useCallback(
    (usd) => {
      const val = parseFloat(usd);
      if (!Number.isFinite(val)) return "—";
      const usdStr = `$${val.toFixed(2)}`;
      if (!tasa) return `${usdStr} (sin tasa)`;
      const bsStr = `${(val * tasa).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
      return `${usdStr} · ${bsStr}`;
    },
    [tasa],
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
        setCurrency: changeCurrency,
        toggleCurrency,
        registrarTasa,
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
      setCurrency: () => {},
      toggleCurrency: () => {},
      registrarTasa: async () => {},
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
