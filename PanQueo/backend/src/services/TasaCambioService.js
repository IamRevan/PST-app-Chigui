/**
 * TasaCambioService
 * Persiste las tasas oficiales (USD y EUR) del BCV en `historial_tasa_cambio`.
 * Una fila por "fecha valor": si el BCV publica la tasa del día siguiente,
 * se actualiza esa fila en lugar de duplicarla.
 */

const { HistorialTasaCambio } = require('../models');
const { obtenerTasasBCV } = require('./BCVService');

const FUENTE_AUTO = 'BCV (auto)';

const hoyISO = () => new Date().toISOString().slice(0, 10);

const aNumero = (valor) => {
  const numero = parseFloat(valor);
  return Number.isFinite(numero) ? numero : null;
};

/** El BCV entrega 8 decimales; la tabla guarda 4. Se normaliza para comparar sin ruido. */
const aCuatroDecimales = (valor) => {
  const numero = aNumero(valor);
  return numero === null ? null : Math.round(numero * 10000) / 10000;
};

/** Tasa vigente: la de fecha de registro más reciente. */
const obtenerTasaVigente = () =>
  HistorialTasaCambio.findOne({
    order: [
      ['fecha_registro', 'DESC'],
      ['id_tasa', 'DESC'],
    ],
  });

/**
 * Sincroniza las tasas con el BCV.
 * @param {{ forzar?: boolean }} opciones  forzar = evita la caché en memoria.
 * @returns {Promise<{ tasa: object, actualizada: boolean, fuente: string, fechaValor: string, respaldo: boolean }>}
 */
const sincronizarDesdeBCV = async ({ forzar = false } = {}) => {
  const tasas = await obtenerTasasBCV({ forzar });
  const fechaValor = tasas.fechaValor || hoyISO();

  const usd = aCuatroDecimales(tasas.usd);
  if (usd === null) {
    throw new Error('El BCV no devolvió una tasa USD válida');
  }
  const eur = aCuatroDecimales(tasas.eur);
  const ahora = new Date();

  const existente = await HistorialTasaCambio.findOne({
    where: { fecha_valor: fechaValor },
    order: [['id_tasa', 'DESC']],
  });

  if (!existente) {
    const tasa = await HistorialTasaCambio.create({
      fecha_registro: fechaValor,
      fecha_valor: fechaValor,
      valor_bs_por_usd: usd,
      valor_bs_por_eur: eur,
      fuente_referencia: FUENTE_AUTO,
      sincronizado_en: ahora,
    });
    return { tasa, actualizada: true, fuente: tasas.fuente, fechaValor, respaldo: !!tasas.respaldo };
  }

  const usdPrevio = aNumero(existente.valor_bs_por_usd);
  const eurPrevio = aNumero(existente.valor_bs_por_eur);
  const cambia = usdPrevio !== usd || (eur !== null && eurPrevio !== eur);

  // Se actualiza siempre `sincronizado_en` para que la UI muestre la última
  // verificación real, aunque la tasa no haya cambiado.
  existente.valor_bs_por_usd = usd;
  if (eur !== null) existente.valor_bs_por_eur = eur;
  existente.fecha_registro = existente.fecha_registro || fechaValor;
  existente.fuente_referencia = FUENTE_AUTO;
  existente.sincronizado_en = ahora;
  await existente.save();

  return { tasa: existente, actualizada: cambia, fuente: tasas.fuente, fechaValor, respaldo: !!tasas.respaldo };
};

module.exports = {
  sincronizarDesdeBCV,
  obtenerTasaVigente,
  FUENTE_AUTO,
};
