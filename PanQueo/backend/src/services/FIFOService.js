const { Op } = require('sequelize');
const {
  LoteIngrediente, Ingrediente, RecetaIngrediente, Pedido, DetallePedido,
} = require('../models');
const sequelize = require('../config/database');

class FIFOService {
  /**
   * Construye el requerimiento agregado de ingredientes de un pedido.
   * Fuente de verdad: pedido_detalles (multi-receta, con cantidad por receta).
   * Fallback legacy: pedido.id_receta único con cantidad 1.
   */
  async construirRequerimientos(idPedido, transaction) {
    const detalles = await DetallePedido.findAll({ where: { id_pedido: idPedido }, transaction });

    let lineas;
    if (detalles.length > 0) {
      lineas = detalles.map((d) => ({
        id_receta: d.id_receta,
        cantidad: parseFloat(d.cantidad) || 1,
      }));
    } else {
      const pedido = await Pedido.findByPk(idPedido, { transaction });
      if (!pedido || !pedido.id_receta) {
        throw new Error('El pedido no tiene recetas asociadas');
      }
      lineas = [{ id_receta: pedido.id_receta, cantidad: 1 }];
    }

    const recetaIds = [...new Set(lineas.map((l) => l.id_receta))];
    const recetaIngredientes = await RecetaIngrediente.findAll({
      where: { id_receta: { [Op.in]: recetaIds } },
      include: [{ model: Ingrediente }],
      transaction,
    });

    if (recetaIngredientes.length === 0) {
      throw new Error('Las recetas del pedido no tienen ingredientes registrados');
    }

    // Agregación: el mismo ingrediente puede venir de varias recetas en el pedido
    const requerimientos = new Map(); // id_ingrediente -> { cantidad, nombre }
    for (const linea of lineas) {
      const ingredientesReceta = recetaIngredientes.filter((ri) => ri.id_receta === linea.id_receta);
      if (ingredientesReceta.length === 0) {
        throw new Error(`La receta ID ${linea.id_receta} no tiene ingredientes registrados`);
      }
      for (const ri of ingredientesReceta) {
        const necesita = Math.round(parseFloat(ri.cantidad_requerida) * linea.cantidad * 100) / 100;
        const actual = requerimientos.get(ri.id_ingrediente) || {
          cantidad: 0,
          nombre: ri.Ingrediente?.nombre_ing || `ID ${ri.id_ingrediente}`,
        };
        actual.cantidad = Math.round((actual.cantidad + necesita) * 100) / 100;
        requerimientos.set(ri.id_ingrediente, actual);
      }
    }

    return requerimientos;
  }

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

      // Idempotencia (Regla 1): el inventario solo se descuenta una vez por pedido
      if (pedido.estado_entrega === 'En Cocina') {
        throw new Error('El pedido ya fue procesado a "En Cocina": el descuento de inventario ya se realizó');
      }

      const requerimientos = await this.construirRequerimientos(idPedido, transaction);
      const ingredientIds = [...requerimientos.keys()];

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
      for (const [idIngrediente, req] of requerimientos.entries()) {
        const lotes = lotesMap.get(idIngrediente) || [];
        const stockTotal = lotes.reduce((sum, l) => sum + parseFloat(l.cantidad_actual), 0);

        if (stockTotal < req.cantidad) {
          throw new Error(
            `Stock insuficiente para ${req.nombre}. ` +
            `Requerido: ${req.cantidad}, Disponible: ${stockTotal}`
          );
        }
      }

      // 2. Descontar en memoria y recolectar lotes modificados
      const lotesModificados = [];
      for (const [idIngrediente, req] of requerimientos.entries()) {
        let cantidadRequerida = req.cantidad;
        const lotes = lotesMap.get(idIngrediente) || [];

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
