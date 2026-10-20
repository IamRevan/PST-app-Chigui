const { Op } = require('sequelize');
const { Pedido, Receta, RecetaIngrediente, Ingrediente, ConsumoLote, LoteIngrediente, DetallePedido } = require('../models');

exports.produccion = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const where = {};
    if (fecha_inicio && fecha_fin) {
      where.fecha_entrega = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const pedidos = await Pedido.findAll({
      where: { ...where, estado_entrega: { [Op.in]: ['Entregado', 'Listo', 'En Cocina'] } },
      include: [
        { model: Receta },
        { model: DetallePedido, include: [{ model: Receta, as: 'Receta' }] },
      ],
      order: [['fecha_entrega', 'ASC']],
    });

    const totalProducido = pedidos.length;
    const producidosPorReceta = {};
    for (const p of pedidos) {
      const detalles = p.DetallePedidos || p.pedido_detalles || [];
      if (detalles.length > 0) {
        // Multi-receta: cada línea de pedido_detalles aporta su cantidad
        for (const d of detalles) {
          const nombre = d.Receta?.nombre_receta || 'Sin receta';
          const unidades = Math.round((parseFloat(d.cantidad) || 1) * 100) / 100;
          producidosPorReceta[nombre] = Math.round(((producidosPorReceta[nombre] || 0) + unidades) * 100) / 100;
        }
      } else {
        // Legacy: pedido con id_receta único
        const nombre = p.Receta?.nombre_receta || 'Sin receta';
        producidosPorReceta[nombre] = (producidosPorReceta[nombre] || 0) + 1;
      }
    }

    res.json({
      status: 'success',
      data: {
        totalProducido,
        producidosPorReceta,
        pedidos,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al generar reporte de producción' });
  }
};

exports.mermas = async (req, res) => {
  try {
    const { LoteIngrediente } = require('../models');
    const ahora = new Date();
    const lotesVencidos = await LoteIngrediente.findAll({
      where: {
        fecha_venc: { [Op.lt]: ahora },
        cantidad_actual: { [Op.gt]: 0 },
      },
      include: [{ model: Ingrediente }],
      order: [['fecha_venc', 'DESC']],
    });

    const mermaTotal = lotesVencidos.reduce((sum, l) => sum + parseFloat(l.cantidad_actual), 0);
    const mermaValor = lotesVencidos.reduce((sum, l) => {
      if (l.precio_compra_unitario) {
        return sum + parseFloat(l.cantidad_actual) * parseFloat(l.precio_compra_unitario);
      }
      return sum;
    }, 0);

    res.json({
      status: 'success',
      data: {
        totalLotesVencidos: lotesVencidos.length,
        mermaTotal,
        mermaValorEstimado: Math.ceil(mermaValor * 100) / 100,
        lotes: lotesVencidos,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al generar reporte de mermas' });
  }
};

exports.trazabilidad = async (req, res) => {
  try {
    const { ingrediente, pedido, limit = 50 } = req.query;
    const where = {};
    if (ingrediente) where.id_ingrediente = Number(ingrediente);
    if (pedido) where.id_pedido = Number(pedido);

    const consumos = await ConsumoLote.findAll({
      where,
      include: [
        { model: Ingrediente },
        { model: LoteIngrediente },
        { model: Pedido, attributes: ['id_pedido', 'id_cliente', 'fecha_entrega'] },
      ],
      order: [['created_at', 'DESC'], ['id_consumo', 'DESC']],
      limit: Math.min(Number(limit) || 50, 200),
    });

    // Auditoría FEFO de la sesión: ¿alguno de los lotes consumidos era
    // consumible mientras existía otro más antiguo disponible? (Regla 9)
    const fechaConsumoDe = (c) => c.createdAt || c.created_at;
    // Los lotes consumidos en el MISMO pedido/operación se agotan por orden FIFO
    // entre sí: no cuentan como "omitidos" más antiguos.
    const lotesDeSuPropiaOperacion = new Map();
    for (const c of consumos) {
      const key = `${c.id_pedido ?? 'ajuste'}|${c.id_ingrediente}|${fechaConsumoDe(c)}`;
      if (!lotesDeSuPropiaOperacion.has(key)) {
        lotesDeSuPropiaOperacion.set(key, new Set());
      }
      lotesDeSuPropiaOperacion.get(key).add(c.id_lote);
    }

    const lotesPorIngrediente = new Map();
    const ingredienteIds = [...new Set(consumos.map((c) => c.id_ingrediente))];
    if (ingredienteIds.length > 0) {
      const todosLosLotes = await LoteIngrediente.findAll({
        where: { id_ingrediente: { [Op.in]: ingredienteIds } },
        order: [['fecha_venc', 'ASC']],
      });
      for (const lote of todosLosLotes) {
        if (!lotesPorIngrediente.has(lote.id_ingrediente)) {
          lotesPorIngrediente.set(lote.id_ingrediente, []);
        }
        lotesPorIngrediente.get(lote.id_ingrediente).push(lote);
      }
    }

    const registros = consumos.map((c) => {
      const fechaConsumo = fechaConsumoDe(c);
      const key = `${c.id_pedido ?? 'ajuste'}|${c.id_ingrediente}|${fechaConsumo}`;
      const mismosDelPedido = lotesDeSuPropiaOperacion.get(key) || new Set();
      const losLotes = lotesPorIngrediente.get(c.id_ingrediente) || [];
      const masAntiguosDisponibles = losLotes.filter((l) =>
        !mismosDelPedido.has(l.id_lote) &&
        l.id_lote !== c.id_lote &&
        new Date(l.fecha_venc) < new Date(c.LoteIngrediente?.fecha_venc || l.fecha_venc) &&
        new Date(l.fecha_ingreso) <= fechaConsumo
      );
      return {
        id_consumo: c.id_consumo,
        ingrediente: c.Ingrediente?.nombre_ing || `ID ${c.id_ingrediente}`,
        cantidad_consumida: parseFloat(c.cantidad_consumida),
        lote: c.LoteIngrediente ? {
          id_lote: c.LoteIngrediente.id_lote,
          fecha_ingreso: c.LoteIngrediente.fecha_ingreso,
          fecha_venc: c.LoteIngrediente.fecha_venc,
        } : null,
        pedido: c.Pedido ? { id_pedido: c.Pedido.id_pedido } : null,
        fecha_consumo: fechaConsumo,
        fefo: masAntiguosDisponibles.length === 0,
        lotes_mas_antiguos_omitidos: masAntiguosDisponibles.map((l) => l.id_lote),
      };
    });

    const totalConsumido = registros.reduce((s, r) => s + r.cantidad_consumida, 0);
    const violacionesFEFO = registros.filter((r) => !r.fefo).length;

    res.json({
      status: 'success',
      data: {
        totalRegistros: registros.length,
        totalConsumido: Math.ceil(totalConsumido * 100) / 100,
        violacionesFEFO,
        registros,
      },
    });
  } catch (error) {
    console.error('Error trazabilidad:', error);
    res.status(500).json({ status: 'error', message: 'Error al generar trazabilidad FEFO' });
  }
};

exports.balancePedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll();

    const totales = pedidos.reduce(
      (acc, p) => {
        acc.totalVentas += parseFloat(p.costo_total || 0);
        acc.totalAbonado += parseFloat(p.monto_abonado || 0);
        if (p.estado_pago === 'Pendiente') acc.pendientes++;
        else if (p.estado_pago === 'Abonado') acc.abonados++;
        else if (p.estado_pago === 'Pagado') acc.pagados++;
        return acc;
      },
      { totalVentas: 0, totalAbonado: 0, pendientes: 0, abonados: 0, pagados: 0 }
    );

    res.json({
      status: 'success',
      data: {
        ...totales,
        totalVentas: Math.ceil(totales.totalVentas * 100) / 100,
        totalAbonado: Math.ceil(totales.totalAbonado * 100) / 100,
        balancePendiente: Math.ceil((totales.totalVentas - totales.totalAbonado) * 100) / 100,
        totalPedidos: pedidos.length,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al generar reporte de balances' });
  }
};
