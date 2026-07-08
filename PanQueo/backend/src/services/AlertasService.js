const { Op } = require('sequelize');
const { LoteIngrediente, Ingrediente } = require('../models');

class AlertasService {
  async getAlertasVencimiento() {
    const hoy = new Date();
    const dentroDe7Dias = new Date();
    dentroDe7Dias.setDate(hoy.getDate() + 7);

    const lotesPorVencer = await LoteIngrediente.findAll({
      where: {
        cantidad_actual: { [Op.gt]: 0 },
        fecha_venc: {
          [Op.between]: [hoy, dentroDe7Dias],
        },
      },
      include: [{ model: Ingrediente }],
      order: [['fecha_venc', 'ASC']],
    });

    return lotesPorVencer.map((lote) => {
      const diasRestantes = Math.ceil(
        (new Date(lote.fecha_venc) - hoy) / (1000 * 60 * 60 * 24)
      );
      return {
        id_lote: lote.id_lote,
        ingrediente: lote.Ingrediente?.nombre_ing || 'Desconocido',
        cantidad: parseFloat(lote.cantidad_actual),
        unidad: lote.Ingrediente?.unidad_medida || '',
        fechaVencimiento: lote.fecha_venc,
        diasRestantes,
        criticidad: diasRestantes <= 3 ? 'ALTA' : 'MEDIA',
      };
    });
  }

  async getStockBajo() {
    const ingredientes = await Ingrediente.findAll();

    const stockBajo = [];

    for (const ing of ingredientes) {
      const stockActual = await LoteIngrediente.sum('cantidad_actual', {
        where: { id_ingrediente: ing.id_ingrediente },
      }) || 0;

      if (parseFloat(stockActual) <= parseFloat(ing.stock_minimo)) {
        stockBajo.push({
          id_ingrediente: ing.id_ingrediente,
          nombre: ing.nombre_ing,
          stockActual: parseFloat(stockActual),
          stockMinimo: parseFloat(ing.stock_minimo),
          unidad: ing.unidad_medida,
        });
      }
    }

    return stockBajo;
  }
}

module.exports = new AlertasService();
