const AsistenteService = require('../services/AsistenteService');

exports.prediccionCompra = async (req, res) => {
  try {
    const predicciones = await AsistenteService.predecirCompra();
    res.json({ status: 'success', data: predicciones });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al generar predicción' });
  }
};

exports.registrarAnomalia = async (req, res) => {
  try {
    const { id_receta, id_ingrediente, cantidad_real_usada } = req.body;
    if (!id_receta || !id_ingrediente || !cantidad_real_usada) {
      return res.status(400).json({ status: 'error', message: 'id_receta, id_ingrediente y cantidad_real_usada son requeridos' });
    }
    const anomalia = await AsistenteService.detectarAnomalias(id_receta, cantidad_real_usada, id_ingrediente);
    res.json({ status: 'success', data: anomalia || { tipo: 'SIN_ANOMALIA', mensaje: 'Consumo dentro del rango esperado' } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al registrar anomalía' });
  }
};

exports.sugerenciasPrecios = async (req, res) => {
  try {
    const { id_receta } = req.query;
    if (!id_receta) {
      return res.status(400).json({ status: 'error', message: 'id_receta es requerido' });
    }
    const resultado = await AsistenteService.sugerirPrecios(id_receta);
    res.json({ status: 'success', data: resultado });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al sugerir precios' });
  }
};
