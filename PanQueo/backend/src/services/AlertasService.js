const { Op } = require('sequelize');
const { sequelize, LoteIngrediente, Ingrediente } = require('../models');

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
    const ingredientes = await Ingrediente.findAll({
      attributes: [
        'id_ingrediente',
        'nombre_ing',
        'stock_minimo',
        'unidad_medida',
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('LoteIngredientes.cantidad_actual')),
            0
          ),
          'stock_actual',
        ],
      ],
      include: [
        {
          model: LoteIngrediente,
          attributes: [],
          required: false,
        },
      ],
      group: [
        'Ingrediente.id_ingrediente',
        'Ingrediente.nombre_ing',
        'Ingrediente.stock_minimo',
        'Ingrediente.unidad_medida',
      ],
      raw: true,
    });

    const stockBajo = [];

    for (const ing of ingredientes) {
      const stockActual = parseFloat(ing.stock_actual) || 0;
      const stockMinimo = parseFloat(ing.stock_minimo) || 0;

      if (stockActual <= stockMinimo) {
        stockBajo.push({
          id_ingrediente: ing.id_ingrediente,
          nombre: ing.nombre_ing,
          stockActual,
          stockMinimo,
          unidad: ing.unidad_medida,
        });
      }
    }

    return stockBajo;
  }
}

module.exports = new AlertasService();
