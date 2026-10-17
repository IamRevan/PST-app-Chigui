const { Pedido, Cliente, Receta, DetallePedido } = require('../models');
const FIFOService = require('../services/FIFOService');
const sequelize = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const { estado_entrega, estado_pago, page = 1, limit = 20 } = req.query;
    const where = {};

    if (estado_entrega) where.estado_entrega = estado_entrega;
    if (estado_pago) where.estado_pago = estado_pago;

    const pedidos = await Pedido.findAndCountAll({
      where,
      include: [{ model: Cliente, attributes: ['nombre', 'apellido', 'cedula'] }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['fecha_pedido', 'DESC']],
    });

    res.json({ status: 'success', data: { pedidos: pedidos.rows, total: pedidos.count } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar pedidos' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        { model: Cliente },
        { model: DetallePedido, include: [{ model: Receta, as: 'Receta', attributes: ['nombre_receta'] }] },
      ],
      order: [[DetallePedido, 'id_detalle', 'ASC']],
    });
    if (!pedido) {
      return res.status(404).json({ status: 'error', message: 'Pedido no encontrado' });
    }
    res.json({ status: 'success', data: pedido });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener pedido' });
  }
};

exports.crear = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      id_cliente, fecha_entrega, detalles, costo_total,
      estado_entrega, estado_pago, es_delivery, direccion_delivery, observaciones,
    } = req.body;

    // --- Validación mínima (evita pedidos vacíos / huérfanos) ---
    if (!id_cliente) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'El ID del cliente es requerido' });
    }
    if (!fecha_entrega) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'La fecha de entrega es requerida' });
    }

    const cliente = await Cliente.findByPk(id_cliente, { transaction });
    if (!cliente) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Cliente no encontrado' });
    }

    const items = Array.isArray(detalles) ? detalles : [];
    if (items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'El pedido debe incluir al menos una receta' });
    }

    // Validar existencia de recetas y cantidad válida
    const idsRecetas = [...new Set(items.map((d) => d.id_receta))];
    if (idsRecetas.some((id) => !id)) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Cada detalle debe referenciar una receta válida' });
    }
    const recetas = await Receta.findAll({ where: { id_receta: idsRecetas }, transaction });
    if (recetas.length !== idsRecetas.length) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Una o más recetas no existen' });
    }
    for (const item of items) {
      const cantidad = parseFloat(item.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: 'Cada detalle debe tener una cantidad mayor a cero' });
      }
    }

    // costo_total: calculado en el servidor si no viene (qty × precio por detalle)
    const costoCalculado = items.reduce(
      (sum, d) => sum + parseFloat(d.cantidad) * (parseFloat(d.precio_unitario) || 0),
      0
    );
    const costoFinal = costo_total != null && Number.isFinite(parseFloat(costo_total))
      ? parseFloat(costo_total)
      : Math.round(costoCalculado * 100) / 100;

    if (!Number.isFinite(costoFinal) || costoFinal < 0) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'El costo total del pedido es inválido' });
    }

    // Compatibilidad: id_receta único solo cuando el pedido es de una sola receta
    const idRecetaUnica = idsRecetas.length === 1 ? idsRecetas[0] : null;

    const pedido = await Pedido.create(
      {
        id_cliente,
        id_receta: idRecetaUnica,
        fecha_entrega,
        costo_total: costoFinal,
        estado_entrega: estado_entrega || 'Por Preparar',
        estado_pago: estado_pago || 'Pendiente',
        es_delivery: es_delivery || false,
        direccion_delivery: direccion_delivery || null,
        observaciones: observaciones || null,
      },
      { transaction }
    );

    await DetallePedido.bulkCreate(
      items.map((d) => ({
        id_pedido: pedido.id_pedido,
        id_receta: d.id_receta,
        cantidad: parseFloat(d.cantidad),
        precio_unitario: d.precio_unitario != null ? parseFloat(d.precio_unitario) : null,
      })),
      { transaction }
    );

    await transaction.commit();

    const pedidoCompleto = await Pedido.findByPk(pedido.id_pedido, {
      include: [
        { model: Cliente, attributes: ['nombre', 'apellido', 'cedula'] },
        { model: DetallePedido, include: [{ model: Receta, as: 'Receta', attributes: ['nombre_receta'] }] },
      ],
    });
    res.status(201).json({ status: 'success', data: pedidoCompleto });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al crear pedido' });
  }
};

exports.cambiarEstado = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { estado_entrega, estado_pago, monto_abonado } = req.body;
    const pedido = await Pedido.findByPk(req.params.id, { transaction });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Pedido no encontrado' });
    }

    if (estado_entrega === 'En Cocina') {
      // Idempotencia: si ya se descontó el inventario (FIFO), no repetir el consumo
      if (pedido.estado_entrega === 'En Cocina') {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'El pedido ya se encuentra "En Cocina": los ingredientes ya fueron descontados (FIFO).',
        });
      }
      try {
        await FIFOService.consumirIngredientes(pedido.id_pedido, { transaction });
      } catch (fifoError) {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: fifoError.message });
      }
    }

    if (estado_entrega) pedido.estado_entrega = estado_entrega;
    if (estado_pago) pedido.estado_pago = estado_pago;
    const abono = monto_abonado != null ? parseFloat(monto_abonado) : NaN;
    if (Number.isFinite(abono) && abono > 0) {
      pedido.monto_abonado = parseFloat(pedido.monto_abonado) + abono;
      if (parseFloat(pedido.monto_abonado) >= parseFloat(pedido.costo_total)) {
        pedido.estado_pago = 'Pagado';
      } else if (parseFloat(pedido.monto_abonado) > 0) {
        pedido.estado_pago = 'Abonado';
      }
    }

    await pedido.save({ transaction });
    await transaction.commit();
    res.json({ status: 'success', data: pedido });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al actualizar estado' });
  }
};
