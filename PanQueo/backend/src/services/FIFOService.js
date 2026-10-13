const { Op } = require('sequelize');
const { LoteIngrediente, Ingrediente, RecetaIngrediente, Pedido } = require('../models');
const sequelize = require('../config/database');

class FIFOService {
  /**
   * Implementa FIFO para consumir ingredientes de lotes.
   * Ordena por fecha_venc ASC, consume el lote más antiguo primero.
   * Si un lote no cubre la cantidad, toma el total y sigue con el siguiente.
   * Si no hay suficiente stock total, hace rollback y lanza error.
   */
  async consumirIngredientes(idPedido, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    let ownTransaction = !options.transaction;

    try {
      const pedido = await Pedido.findByPk(idPedido, { transaction });
      if (!pedido) throw new Error('Pedido no encontrado');

      const recetaIngredientes = await RecetaIngrediente.findAll({
        where: { id_receta: pedido.id_receta },
        include: [{ model: Ingrediente }],
        transaction,
      });

      const ingredientIds = recetaIngredientes.map((ri) => ri.id_ingrediente);

      if (ingredientIds.length > 0) {
        // Obtener todos los lotes necesarios en una sola consulta ordenados por fecha_venc ASC (FIFO)
        const todosLosLotes = await LoteIngrediente.findAll({
          where: {
            id_ingrediente: { [Op.in]: ingredientIds },
            cantidad_actual: { [Op.gt]: 0 },
          },
          order: [['fecha_venc', 'ASC']],
          transaction,
        });

        // Agrupar lotes por id_ingrediente
        const lotesMap = new Map();
        for (const lote of todosLosLotes) {
          if (!lotesMap.has(lote.id_ingrediente)) {
            lotesMap.set(lote.id_ingrediente, []);
          }
          lotesMap.get(lote.id_ingrediente).push(lote);
        }

        // 1. Validar primero que todos los ingredientes tengan stock suficiente
        for (const ri of recetaIngredientes) {
          const cantidadRequerida = parseFloat(ri.cantidad_requerida);
          const lotes = lotesMap.get(ri.id_ingrediente) || [];
          const stockTotal = lotes.reduce((sum, l) => sum + parseFloat(l.cantidad_actual), 0);

          if (stockTotal < cantidadRequerida) {
            throw new Error(
              `Stock insuficiente para ${ri.Ingrediente?.nombre_ing || 'ingrediente'}. ` +
              `Requerido: ${cantidadRequerida}, Disponible: ${stockTotal}`
            );
          }
        }

        // 2. Descontar en memoria y recolectar lotes modificados
        const lotesModificados = [];
        for (const ri of recetaIngredientes) {
          let cantidadRequerida = parseFloat(ri.cantidad_requerida);
          const lotes = lotesMap.get(ri.id_ingrediente) || [];

          for (const lote of lotes) {
            if (cantidadRequerida <= 0) break;

            const disponible = parseFloat(lote.cantidad_actual);
            if (disponible >= cantidadRequerida) {
              lote.cantidad_actual = (disponible - cantidadRequerida).toFixed(2);
              cantidadRequerida = 0;
            } else {
              lote.cantidad_actual = 0;
              cantidadRequerida -= disponible;
            }
            lotesModificados.push(lote);
          }
        }

        // 3. Guardar en paralelo solo los lotes modificados
        if (lotesModificados.length > 0) {
          await Promise.all(lotesModificados.map((lote) => lote.save({ transaction })));
        }
      }

      // Actualizar estado del pedido
      pedido.estado_entrega = 'En Cocina';
      await pedido.save({ transaction });

      if (ownTransaction) await transaction.commit();
      return { success: true, message: 'Ingredientes consumidos correctamente' };
    } catch (error) {
      if (ownTransaction) await transaction.rollback();
      throw error;
    }
  }

  async verificarStockSuficiente(idReceta) {
    const recetaIngredientes = await RecetaIngrediente.findAll({
      where: { id_receta: idReceta },
      include: [{ model: Ingrediente }],
    });

    if (recetaIngredientes.length === 0) {
      return { suficiente: true, detalles: [] };
    }

    const ingredientIds = recetaIngredientes.map((ri) => ri.id_ingrediente);

    // Consulta agregada única para sumar stock disponible por ingrediente
    const stockTotales = await LoteIngrediente.findAll({
      attributes: [
        'id_ingrediente',
        [sequelize.fn('SUM', sequelize.col('cantidad_actual')), 'total_stock'],
      ],
      where: {
        id_ingrediente: { [Op.in]: ingredientIds },
        cantidad_actual: { [Op.gt]: 0 },
      },
      group: ['id_ingrediente'],
      raw: true,
    });

    const stockMap = new Map();
    for (const item of stockTotales) {
      stockMap.set(item.id_ingrediente, parseFloat(item.total_stock || 0));
    }

    const resultados = recetaIngredientes.map((ri) => {
      const cantidadRequerida = parseFloat(ri.cantidad_requerida);
      const stockDisponible = stockMap.get(ri.id_ingrediente) || 0;

      return {
        ingrediente: ri.Ingrediente?.nombre_ing || `ID ${ri.id_ingrediente}`,
        requerido: cantidadRequerida,
        disponible: stockDisponible,
        suficiente: stockDisponible >= cantidadRequerida,
      };
    });

    return {
      suficiente: resultados.every((r) => r.suficiente),
      detalles: resultados,
    };
  }
}

module.exports = new FIFOService();
