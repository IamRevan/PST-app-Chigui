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

      for (const ri of recetaIngredientes) {
        let cantidadRequerida = parseFloat(ri.cantidad_requerida);
        const idIngrediente = ri.id_ingrediente;

        // Obtener lotes ordenados por fecha_venc ASC (FIFO)
        const lotes = await LoteIngrediente.findAll({
          where: {
            id_ingrediente: idIngrediente,
            cantidad_actual: { [Op.gt]: 0 },
          },
          order: [['fecha_venc', 'ASC']],
          transaction,
        });

        // Calcular stock total disponible
        const stockTotal = lotes.reduce((sum, l) => sum + parseFloat(l.cantidad_actual), 0);

        if (stockTotal < cantidadRequerida) {
          throw new Error(
            `Stock insuficiente para ${ri.Ingrediente?.nombre_ing || 'ingrediente'}. ` +
            `Requerido: ${cantidadRequerida}, Disponible: ${stockTotal}`
          );
        }

        // Consumir de lotes en orden FIFO
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
          await lote.save({ transaction });
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

    const resultados = [];

    for (const ri of recetaIngredientes) {
      const cantidadRequerida = parseFloat(ri.cantidad_requerida);

      const stockTotal = await LoteIngrediente.sum('cantidad_actual', {
        where: {
          id_ingrediente: ri.id_ingrediente,
          cantidad_actual: { [Op.gt]: 0 },
        },
      });

      resultados.push({
        ingrediente: ri.Ingrediente?.nombre_ing || `ID ${ri.id_ingrediente}`,
        requerido: cantidadRequerida,
        disponible: parseFloat(stockTotal || 0),
        suficiente: parseFloat(stockTotal || 0) >= cantidadRequerida,
      });
    }

    return {
      suficiente: resultados.every((r) => r.suficiente),
      detalles: resultados,
    };
  }
}

module.exports = new FIFOService();
