const { HistorialTasaCambio } = require('../models');

exports.tasaActual = async (req, res) => {
  try {
    const tasa = await HistorialTasaCambio.findOne({
      order: [['fecha_registro', 'DESC']],
    });
    res.json({
      status: 'success',
      data: tasa || { valor_bs_por_usd: null, mensaje: 'No hay tasa registrada' },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener tasa actual' });
  }
};

exports.registrarTasa = async (req, res) => {
  try {
    const { valor_bs_por_usd, fuente_referencia } = req.body;
    const tasa = await HistorialTasaCambio.create({
      valor_bs_por_usd,
      fuente_referencia: fuente_referencia || 'BCV',
      fecha_registro: new Date(),
    });
    res.status(201).json({ status: 'success', data: tasa });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al registrar tasa' });
  }
};

exports.historialTasas = async (req, res) => {
  try {
    const tasas = await HistorialTasaCambio.findAll({
      order: [['fecha_registro', 'DESC']],
      limit: 30,
    });
    res.json({ status: 'success', data: tasas });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener historial de tasas' });
  }
};
