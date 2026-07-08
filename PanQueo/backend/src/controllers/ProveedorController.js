const { Proveedor } = require('../models');

exports.listar = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [['nombre', 'ASC']] });
    res.json({ status: 'success', data: proveedores });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar proveedores' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ status: 'error', message: 'Proveedor no encontrado' });
    res.json({ status: 'success', data: proveedor });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener proveedor' });
  }
};

exports.crear = async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json({ status: 'success', data: proveedor });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al crear proveedor' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ status: 'error', message: 'Proveedor no encontrado' });
    await proveedor.update(req.body);
    res.json({ status: 'success', data: proveedor });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al actualizar proveedor' });
  }
};
