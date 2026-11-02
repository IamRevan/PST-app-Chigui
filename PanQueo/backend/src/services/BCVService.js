/**
 * BCVService
 * Obtiene las tasas oficiales USD y EUR publicadas por el Banco Central de Venezuela.
 *
 * Fuente primaria: scrapper de https://www.bcv.org.ve/ (bloques #dolar y #euro).
 * Fuente de respaldo: API pública ve.dolarapi.com (misma data oficial del BCV),
 * usada solo si el sitio del BCV no responde o cambia su estructura.
 */

const https = require('https');

const BCV_URL = 'https://www.bcv.org.ve/';
const RESPALDO_USD = 'https://ve.dolarapi.com/v1/dolares/oficial';
const RESPALDO_EUR = 'https://ve.dolarapi.com/v1/euros/oficial';

const TIMEOUT_MS = parseInt(process.env.BCV_TIMEOUT_MS || '20000', 10);
const CACHE_MS = parseInt(process.env.BCV_CACHE_MS || '300000', 10); // 5 min

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let cache = null;

/** Convierte "888,11830000" o "1.234,56" al número 888.1183 / 1234.56 */
const limpiarNumero = (valor) => {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).replace(/[^\d.,]/g, '').trim();
  if (!limpio) return null;
  const normalizado = limpio.replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(normalizado);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
};

/** Extrae la tasa de un bloque <div id="dolar"> / <div id="euro"> del HTML del BCV. */
const extraerTasa = (html, id) => {
  if (typeof html !== 'string') return null;
  const inicio = html.indexOf(`id="${id}"`);
  if (inicio === -1) return null;
  const bloque = html.slice(inicio, inicio + 800);
  const match = bloque.match(/<strong[^>]*>\s*([\d.,]+)\s*<\/strong>/i);
  return match ? limpiarNumero(match[1]) : null;
};

/** Extrae la "Fecha Valor" que acompaña a la tasa oficial (YYYY-MM-DD). */
const extraerFechaValor = (html) => {
  if (typeof html !== 'string') return null;
  const inicio = html.indexOf('id="dolar"');
  const bloque = inicio === -1 ? html : html.slice(inicio, inicio + 1600);
  const match = bloque.match(/content="(\d{4}-\d{2}-\d{2})T/);
  return match ? match[1] : null;
};

/** Parsea el HTML completo del BCV. Exportado para pruebas unitarias. */
const parsearTasasBCV = (html) => {
  const usd = extraerTasa(html, 'dolar');
  const eur = extraerTasa(html, 'euro');
  if (!usd && !eur) {
    throw new Error('No se pudieron leer las tasas del BCV (estructura del sitio no reconocida)');
  }
  return { usd, eur, fechaValor: extraerFechaValor(html) };
};

const peticion = (url, { rechazarNoSeguro = true, redirecciones = 0 } = {}) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-VE,es;q=0.9,en;q=0.8',
        },
        timeout: TIMEOUT_MS,
        rejectUnauthorized: rechazarNoSeguro,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirecciones < 3) {
          res.resume();
          const destino = new URL(res.headers.location, url).toString();
          return resolve(peticion(destino, { rechazarNoSeguro, redirecciones: redirecciones + 1 }));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`El BCV respondió con estado HTTP ${res.statusCode}`));
        }
        let datos = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (datos += chunk));
        res.on('end', () => resolve({ body: datos, url }));
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Tiempo de espera agotado consultando el BCV'));
    });
  });

/**
 * El certificado del BCV suele tener la cadena incompleta. Primero se intenta
 * con validación TLS estricta y solo si falla por certificado se reintenta sin
 * verificar (el contenido es público y de solo lectura).
 */
const descargarBCV = async () => {
  try {
    return await peticion(BCV_URL);
  } catch (error) {
    const esCertificado = /certificate|self.signed|unable to verify|altname/i.test(error.message || '');
    if (!esCertificado) throw error;
    console.warn('[BCV] Certificado TLS no verificable, se reintenta sin validación estricta');
    return peticion(BCV_URL, { rechazarNoSeguro: false });
  }
};

const consultarRespaldo = async () => {
  const [usdRes, eurRes] = await Promise.all([peticion(RESPALDO_USD), peticion(RESPALDO_EUR)]);
  const usd = JSON.parse(usdRes.body);
  const eur = JSON.parse(eurRes.body);
  const usdValor = parseFloat(usd?.promedio);
  const eurValor = parseFloat(eur?.promedio);
  if (!Number.isFinite(usdValor)) throw new Error('El respaldo no devolvió una tasa USD válida');
  return {
    usd: usdValor,
    eur: Number.isFinite(eurValor) ? eurValor : null,
    fechaValor: (usd?.fechaActualizacion || '').slice(0, 10) || null,
    fuente: 'dolarapi (respaldo oficial)',
    url: RESPALDO_USD,
  };
};

/**
 * Devuelve { usd, eur, fechaValor, fuente, url, obtenidoEn, respaldo }
 * Usa caché en memoria para no golpear el BCV en cada consulta.
 */
const obtenerTasasBCV = async ({ forzar = false } = {}) => {
  if (!forzar && cache && Date.now() - cache.obtenidoEn < CACHE_MS) {
    return cache;
  }

  try {
    const { body, url } = await descargarBCV();
    const tasas = parsearTasasBCV(body);
    cache = {
      usd: tasas.usd,
      eur: tasas.eur,
      fechaValor: tasas.fechaValor,
      fuente: 'BCV',
      url,
      respaldo: false,
      obtenidoEn: Date.now(),
    };
    return cache;
  } catch (error) {
    console.warn(`[BCV] No se pudo consultar el sitio oficial: ${error.message}`);
    const respaldo = await consultarRespaldo();
    cache = { ...respaldo, respaldo: true, obtenidoEn: Date.now() };
    return cache;
  }
};

module.exports = {
  obtenerTasasBCV,
  parsearTasasBCV,
  limpiarNumero,
  extraerTasa,
  extraerFechaValor,
  BCV_URL,
};
