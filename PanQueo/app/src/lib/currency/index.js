import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getItem,
  setItem,
} from "../utils/storage";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { STORAGE_KEYS } from "../utils/constants";

/**
 * Contexto global de moneda (RF-03 / Regla de Negocio 6):
 * - Moneda activa ('Bs' | 'USD') persistida en AsyncStorage.
 * - Tasa BCV vigente obtenida de GET /api/finanzas/tasas/actual
 *   (último registro de HISTORIAL_TASA_CAMBIO).
 * - `format(monto)` transforma montos base (USD) a la moneda activa.
 */
const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("Bs");
  const [tasa, setTasa] = useState(null); // valor_bs_por_usd

  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(STORAGE_KEYS.CURRENCY);
        if (stored === "Bs" || stored === "USD") setCurrency(stored);
      } catch {
        // sin persistencia disponible: default Bs
      }
    })();

    let alive = true;
    apiClient
      .get(ENDPOINTS.TASAS_ACTUAL)
      .then((res) => {
        if (!alive) return;
        const data = res.data?.data ?? res.data;
        const valor = data?.valor_bs_por_usd;
        if (valor != null && Number.isFinite(parseFloat(valor))) {
          setTasa(parseFloat(valor));
        }
      })
      .catch(() => {
        // Tasa no disponible: el formateador mostrará montos directos
      });
    return () => {
      alive = false;
    };
  }, []);

  const changeCurrency = useCallback(async (c) => {
    setCurrency(c);
    try {
      await setItem(STORAGE_KEYS.CURRENCY, c);
    } catch {
      // ignorar fallo de persistencia
    }
  }, []);

  const format = useCallback(
    (monto, options = {}) => {
      const { withSymbol = true } = options;
      const valor = parseFloat(monto);
      if (!Number.isFinite(valor)) return "—";
      if (currency === "USD") {
        return withSymbol ? `$${valor.toFixed(2)}` : valor.toFixed(2);
      }
      const bs = tasa ? valor * tasa : valor;
      return withSymbol ? `Bs ${bs.toFixed(2)}` : bs.toFixed(2);
    },
    [currency, tasa],
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, tasa, setCurrency: changeCurrency, format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  // Fallback seguro si algún screen se renderiza fuera del provider
  return (
    ctx || {
      currency: "Bs",
      tasa: null,
      setCurrency: () => {},
      format: (monto, options = {}) => {
        const { withSymbol = true } = options;
        const valor = parseFloat(monto);
        if (!Number.isFinite(valor)) return "—";
        return withSymbol ? `Bs ${valor.toFixed(2)}` : valor.toFixed(2);
      },
    }
  );
};
