const { Op } = require('sequelize');
const { Pedido, Receta, RecetaIngrediente, Ingrediente } = require('../models');

exports.produccion = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const where = {};
    if (fecha_inicio && fecha_fin) {
      where.fecha_entrega = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const pedidos = await Pedido.findAll({
      where: { ...where, estado_entrega: { [Op.in]: ['Entregado', 'Listo', 'En Cocina'] } },
      include: [{ model: Receta }],
      order: [['fecha_entrega', 'ASC']],
    });

    const totalProducido = pedidos.length;
    const producidosPorReceta = {};
    for (const p of pedidos) {
      const nombre = p.Receta?.nombre_receta || 'Sin receta';
      producidosPorReceta[nombre] = (producidosPorReceta[nombre] || 0) + 1;
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
