const { Op } = require('sequelize');
const { Ingrediente, LoteIngrediente, Pedido, Receta, HistorialTasaCambio } = require('../models');

class AsistenteService {
  async predecirCompra() {
    const ingredientes = await Ingrediente.findAll();
    const predicciones = [];

    for (const ing of ingredientes) {
      const stockActual = await LoteIngrediente.sum('cantidad_actual', {
        where: { id_ingrediente: ing.id_ingrediente },
      }) || 0;

      const consumoPromedio = await this.calcularConsumoPromedioDiario(ing.id_ingrediente);
      const stockMinimo = parseFloat(ing.stock_minimo);
      const sugerido = Math.max(0, (consumoPromedio * 7) - stockActual);

      if (sugerido > 0 || stockActual <= stockMinimo) {
        predicciones.push({
          ingrediente: ing.nombre_ing,
          stockActual: parseFloat(stockActual),
          stockMinimo,
          consumoPromedioDiario: consumoPromedio,
          sugeridoComprar: Math.ceil(sugerido * 100) / 100,
          critico: stockActual <= stockMinimo,
        });
      }
    }

    return predicciones.sort((a, b) => b.critico - a.critico);
  }

  async calcularConsumoPromedioDiario(idIngrediente) {
    const { RecetaIngrediente, Pedido, sequelize } = require('../models');
    const result = await RecetaIngrediente.findOne({
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('cantidad_requerida')), 0), 'total_consumido'],
      ],
      include: [{
        model: Pedido,
        attributes: [],
        where: {
          estado_entrega: { [Op.in]: ['En Cocina', 'Listo', 'Entregado'] },
        },
      }],
      where: { id_ingrediente: idIngrediente },
      raw: true,
    });

    const totalConsumido = parseFloat(result?.total_consumido || 0);
    const recetasUsadas = await Pedido.count({
      where: {
        estado_entrega: { [Op.in]: ['En Cocina', 'Listo', 'Entregado'] },
      },
    });

    return recetasUsadas > 0 ? totalConsumido / recetasUsadas : 0;
  }

  async detectarAnomalias(recetaId, cantidadRealUsada, ingredienteId) {
    const recetaIng = await require('../models').RecetaIngrediente.findOne({
      where: { id_receta: recetaId, id_ingrediente: ingredienteId },
    });

    if (!recetaIng) return null;

    const cantidadTeorica = parseFloat(recetaIng.cantidad_requerida);
    const diferencia = ((cantidadRealUsada - cantidadTeorica) / cantidadTeorica) * 100;

    if (diferencia > 20) {
      return {
        tipo: 'MERMA_EXCESIVA',
        mensaje: `Consumo real excede en ${diferencia.toFixed(1)}% la cantidad teórica`,
        diferencia,
        fecha: new Date().toISOString(),
      };
    }

    return null;
  }

  async sugerirPrecios(idReceta) {
    const { RecetaIngrediente, Ingrediente, LoteIngrediente } = require('../models');
    const recetaIngs = await RecetaIngrediente.findAll({
      where: { id_receta: idReceta },
      include: [{ model: Ingrediente }],
    });

    let costoTotal = 0;
    let monedaUsada = 'USD';

    for (const ri of recetaIngs) {
      const ultimoLote = await LoteIngrediente.findOne({
        where: { id_ingrediente: ri.id_ingrediente },
        order: [['fecha_ingreso', 'DESC']],
      });

      if (ultimoLote && ultimoLote.precio_compra_unitario) {
        costoTotal += parseFloat(ri.cantidad_requerida) * parseFloat(ultimoLote.precio_compra_unitario);
        if (ultimoLote.moneda === 'Bs') monedaUsada = 'Bs';
      }
    }

    const tasaActual = await this.obtenerTasaActual() || 1;
    const costoEnBs = monedaUsada === 'Bs' ? costoTotal : costoTotal * tasaActual;
    const costoEnUsd = monedaUsada === 'USD' ? costoTotal : costoTotal / tasaActual;

    const precioMinimoUsd = costoEnUsd * 1.2;
    const precioSugeridoUsd = costoEnUsd * 1.35;
    const precioMinimoBs = costoEnBs * 1.2;
    const precioSugeridoBs = costoEnBs * 1.35;

    return {
      costoProduccion: {
        USD: Math.ceil(costoEnUsd * 100) / 100,
        Bs: Math.ceil(costoEnBs * 100) / 100,
      },
      precioMinimoRecomendado: {
        USD: Math.ceil(precioMinimoUsd * 100) / 100,
        Bs: Math.ceil(precioMinimoBs * 100) / 100,
      },
      precioSugerido: {
        USD: Math.ceil(precioSugeridoUsd * 100) / 100,
        Bs: Math.ceil(precioSugeridoBs * 100) / 100,
      },
      margenMinimo: '20%',
      tasaCambioUsada: tasaActual,
    };
  }

  async obtenerTasaActual() {
    const tasa = await HistorialTasaCambio.findOne({
      order: [['fecha_registro', 'DESC']],
    });
    return tasa ? parseFloat(tasa.valor_bs_por_usd) : null;
  }
}

module.exports = new AsistenteService();
