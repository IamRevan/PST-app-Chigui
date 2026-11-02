const { HistorialTasaCambio } = require('../models');
const { sincronizarDesdeBCV } = require('../services/TasaCambioService');

const serializar = (tasa) => ({
  id_tasa: tasa.id_tasa,
  valor_bs_por_usd: tasa.valor_bs_por_usd !== null ? parseFloat(tasa.valor_bs_por_usd) : null,
  valor_bs_por_eur: tasa.valor_bs_por_eur !== null && tasa.valor_bs_por_eur !== undefined
    ? parseFloat(tasa.valor_bs_por_eur)
    : null,
  fecha_registro: tasa.fecha_registro,
  fecha_valor: tasa.fecha_valor,
  fuente_referencia: tasa.fuente_referencia,
  sincronizado_en: tasa.sincronizado_en,
  actualizado_en: tasa.updatedAt || tasa.updated_at || null,
  automatico: /bcv/i.test(tasa.fuente_referencia || ''),
});

exports.tasaActual = async (req, res) => {
  try {
    const tasa = await HistorialTasaCambio.findOne({
      order: [
        ['fecha_registro', 'DESC'],
        ['id_tasa', 'DESC'],
      ],
    });
    res.json({
      status: 'success',
      data: tasa ? serializar(tasa) : { valor_bs_por_usd: null, valor_bs_por_eur: null, mensaje: 'No hay tasa registrada' },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener tasa actual' });
  }
};

/**
 * Sincroniza manualmente contra el BCV (la sincronización automática corre
 * además cada hora en segundo plano).
 */
exports.sincronizarTasa = async (req, res) => {
  try {
    const forzar = req.body?.forzar !== false;
    const resultado = await sincronizarDesdeBCV({ forzar });
    res.json({
      status: 'success',
      data: serializar(resultado.tasa),
      meta: {
        actualizada: resultado.actualizada,
        fuente: resultado.fuente,
        fechaValor: resultado.fechaValor,
        respaldo: resultado.respaldo,
      },
    });
  } catch (error) {
    res.status(502).json({
      status: 'error',
      message: error.message || 'No se pudo sincronizar con el BCV',
    });
  }
};

exports.registrarTasa = async (req, res) => {
  try {
    const { valor_bs_por_usd, valor_bs_por_eur, fuente_referencia } = req.body;
    const usd = parseFloat(valor_bs_por_usd);
    const eur = valor_bs_por_eur === undefined || valor_bs_por_eur === null || valor_bs_por_eur === ''
      ? null
      : parseFloat(valor_bs_por_eur);

    if (!Number.isFinite(usd) || usd <= 0) {
      return res.status(400).json({ status: 'error', message: 'La tasa USD debe ser un número mayor a 0' });
    }
    if (eur !== null && (!Number.isFinite(eur) || eur <= 0)) {
      return res.status(400).json({ status: 'error', message: 'La tasa EUR debe ser un número mayor a 0' });
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const tasa = await HistorialTasaCambio.create({
      valor_bs_por_usd: usd,
      valor_bs_por_eur: eur,
      fuente_referencia: fuente_referencia || 'Manual',
      fecha_registro: hoy,
      fecha_valor: hoy,
      sincronizado_en: null,
    });

    res.status(201).json({ status: 'success', data: serializar(tasa) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al registrar tasa' });
  }
};

exports.historialTasas = async (req, res) => {
  try {
    const tasas = await HistorialTasaCambio.findAll({
      order: [
        ['fecha_registro', 'DESC'],
        ['id_tasa', 'DESC'],
      ],
      limit: 30,
    });
    res.json({ status: 'success', data: tasas.map(serializar) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener historial de tasas' });
  }
};
