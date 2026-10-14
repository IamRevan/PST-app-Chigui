const { Op } = require('sequelize');
const { Ingrediente, LoteIngrediente, Pedido, Receta, HistorialTasaCambio } = require('../models');

class AsistenteService {
  async predecirCompra() {
    const { RecetaIngrediente, Pedido, sequelize } = require('../models');

    // 1. Fetch all ingredients
    const ingredientes = await Ingrediente.findAll();
    if (!ingredientes || ingredientes.length === 0) {
      return [];
    }

    // 2. Fetch total count of qualifying orders once for average calculation
    const recetasUsadas = await Pedido.count({
      where: {
        estado_entrega: { [Op.in]: ['En Cocina', 'Listo', 'Entregado'] },
      },
    });

    // 3. Batch aggregate total stock per ingredient
    const stockGrouped = await LoteIngrediente.findAll({
      attributes: [
        'id_ingrediente',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('cantidad_actual')), 0), 'stockActual'],
      ],
      group: ['id_ingrediente'],
      raw: true,
    });

    const stockMap = new Map();
    for (const item of stockGrouped) {
      stockMap.set(Number(item.id_ingrediente), Number(item.stockActual || item.get?.('stockActual') || 0));
    }

    // 4. Batch aggregate total consumed quantity per ingredient from qualifying orders
    const consumoGrouped = await RecetaIngrediente.findAll({
      attributes: [
        'id_ingrediente',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('cantidad_requerida')), 0), 'totalConsumido'],
      ],
      include: [{
        model: Pedido,
        attributes: [],
        where: {
          estado_entrega: { [Op.in]: ['En Cocina', 'Listo', 'Entregado'] },
        },
      }],
      group: ['RecetaIngrediente.id_ingrediente'],
      raw: true,
    });

    const consumoMap = new Map();
    for (const item of consumoGrouped) {
      consumoMap.set(Number(item.id_ingrediente), Number(item.totalConsumido || item.get?.('totalConsumido') || 0));
    }

    // 5. Build predictions in memory
    const predicciones = [];

    for (const ing of ingredientes) {
      const stockActual = stockMap.get(ing.id_ingrediente) || 0;
      const totalConsumido = consumoMap.get(ing.id_ingrediente) || 0;
      const consumoPromedio = recetasUsadas > 0 ? totalConsumido / recetasUsadas : 0;
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

    if (recetaIngs.length > 0) {
      const ingredientIds = recetaIngs.map((ri) => ri.id_ingrediente);
      const lotes = await LoteIngrediente.findAll({
        where: {
          id_ingrediente: { [Op.in]: ingredientIds },
        },
        order: [['fecha_ingreso', 'DESC']],
      });

      const ultimosLotesMap = new Map();
      for (const lote of lotes) {
        if (!ultimosLotesMap.has(lote.id_ingrediente)) {
          ultimosLotesMap.set(lote.id_ingrediente, lote);
        }
      }

      for (const ri of recetaIngs) {
        const ultimoLote = ultimosLotesMap.get(ri.id_ingrediente);
        if (ultimoLote && ultimoLote.precio_compra_unitario) {
          costoTotal += parseFloat(ri.cantidad_requerida) * parseFloat(ultimoLote.precio_compra_unitario);
          if (ultimoLote.moneda === 'Bs') monedaUsada = 'Bs';
        }
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
