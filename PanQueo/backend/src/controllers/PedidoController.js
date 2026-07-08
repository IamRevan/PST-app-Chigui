const { Pedido, Cliente, Receta } = require('../models');
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
      include: [{ model: Cliente }],
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
    const pedido = await Pedido.create(req.body, { transaction });
    await transaction.commit();
    res.status(201).json({ status: 'success', data: pedido });
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
      try {
        await FIFOService.consumirIngredientes(pedido.id_pedido, { transaction });
      } catch (fifoError) {
        await transaction.rollback();
        return res.status(400).json({ status: 'error', message: fifoError.message });
      }
    }

    if (estado_entrega) pedido.estado_entrega = estado_entrega;
    if (estado_pago) pedido.estado_pago = estado_pago;
    if (monto_abonado) {
      pedido.monto_abonado = parseFloat(pedido.monto_abonado) + parseFloat(monto_abonado);
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
