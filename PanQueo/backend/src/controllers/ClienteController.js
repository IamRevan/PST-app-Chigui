const { Op } = require('sequelize');
const { Cliente, Pedido } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');

exports.listar = asyncHandler(async (req, res) => {
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
}, 'Error al listar clientes');

exports.obtener = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findByPk(req.params.id);
  if (!cliente) {
    return res.status(404).json({ status: 'error', message: 'Cliente no encontrado' });
  }
  res.json({ status: 'success', data: cliente });
}, 'Error al obtener cliente');

exports.crear = asyncHandler(async (req, res) => {
  const { nombre, apellido, cedula, telefono, direccion } = req.body;

  const existe = await Cliente.findOne({ where: { cedula } });
  if (existe) {
    return res.status(400).json({ status: 'error', message: 'La cédula ya está registrada' });
  }

  const cliente = await Cliente.create({ nombre, apellido, cedula, telefono, direccion });
  res.status(201).json({ status: 'success', data: cliente });
}, 'Error al crear cliente');

exports.actualizar = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findByPk(req.params.id);
  if (!cliente) {
    return res.status(404).json({ status: 'error', message: 'Cliente no encontrado' });
  }
  await cliente.update(req.body);
  res.json({ status: 'success', data: cliente });
}, 'Error al actualizar cliente');

exports.historial = asyncHandler(async (req, res) => {
  const pedidos = await Pedido.findAll({
    where: { id_cliente: req.params.id },
    order: [['fecha_pedido', 'DESC']],
  });
  res.json({ status: 'success', data: pedidos });
}, 'Error al obtener historial');
