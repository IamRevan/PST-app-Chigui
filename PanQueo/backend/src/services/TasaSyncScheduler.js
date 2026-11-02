/**
 * Sincronización automática de las tasas BCV (USD y EUR).
 *
 * - Consulta el BCV al arrancar el servidor.
 * - Repite la consulta cada BCV_SYNC_INTERVAL_MIN minutos (60 por defecto).
 * - No se ejecuta en entorno de pruebas.
 */

const { sincronizarDesdeBCV } = require('./TasaCambioService');

const INTERVALO_MIN = Math.max(5, parseInt(process.env.BCV_SYNC_INTERVAL_MIN || '60', 10) || 60);

let temporizador = null;
let enEjecucion = false;

const ejecutarSincronizacion = async (motivo) => {
  if (enEjecucion) return null;
  enEjecucion = true;
  try {
    const resultado = await sincronizarDesdeBCV({ forzar: true });
    const usd = parseFloat(resultado.tasa.valor_bs_por_usd).toFixed(2);
    const eur = resultado.tasa.valor_bs_por_eur
      ? parseFloat(resultado.tasa.valor_bs_por_eur).toFixed(2)
      : 'n/d';
    console.log(
      `[Tasas] ${motivo}: USD ${usd} Bs | EUR ${eur} Bs | fecha valor ${resultado.fechaValor} | fuente ${resultado.fuente}`,
    );
    return resultado;
  } catch (error) {
    console.warn(`[Tasas] Sincronización ${motivo} falló: ${error.message}`);
    return null;
  } finally {
    enEjecucion = false;
  }
};

const iniciarSincronizacionTasas = () => {
  if (process.env.NODE_ENV === 'test') return null;
  if (temporizador) return temporizador;

  // Primera consulta sin bloquear el arranque del servidor
  ejecutarSincronizacion('arranque');

  temporizador = setInterval(() => {
    ejecutarSincronizacion('programada');
  }, INTERVALO_MIN * 60 * 1000);

  if (typeof temporizador.unref === 'function') temporizador.unref();
  console.log(`[Tasas] Sincronización automática activa cada ${INTERVALO_MIN} min`);
  return temporizador;
};

const detenerSincronizacionTasas = () => {
  if (temporizador) clearInterval(temporizador);
  temporizador = null;
};

module.exports = {
  iniciarSincronizacionTasas,
  detenerSincronizacionTasas,
  ejecutarSincronizacion,
};
