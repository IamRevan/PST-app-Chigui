const { Op } = require('sequelize');
const { Cliente, Pedido } = require('../models');

exports.listar = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { cedula: { [Op.iLike]: `%${search}%` } },
        { telefono: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const clientes = await Cliente.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['nombre', 'ASC']],
    });

    res.json({
      status: 'success',
      data: {
        clientes: clientes.rows,
        total: clientes.count,
        pagina: parseInt(page),
        totalPaginas: Math.ceil(clientes.count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar clientes' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ status: 'error', message: 'Cliente no encontrado' });
    }
    res.json({ status: 'success', data: cliente });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener cliente' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, apellido, cedula, telefono, direccion } = req.body;

    const existe = await Cliente.findOne({ where: { cedula } });
    if (existe) {
      return res.status(400).json({ status: 'error', message: 'La cédula ya está registrada' });
    }

    const cliente = await Cliente.create({ nombre, apellido, cedula, telefono, direccion });
    res.status(201).json({ status: 'success', data: cliente });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al crear cliente' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ status: 'error', message: 'Cliente no encontrado' });
    }
    await cliente.update(req.body);
    res.json({ status: 'success', data: cliente });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al actualizar cliente' });
  }
};

exports.historial = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: { id_cliente: req.params.id },
      order: [['fecha_pedido', 'DESC']],
    });
    res.json({ status: 'success', data: pedidos });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener historial' });
  }
};
