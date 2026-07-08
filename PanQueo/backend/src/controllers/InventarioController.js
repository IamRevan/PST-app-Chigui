const { Op } = require('sequelize');
const { Ingrediente, LoteIngrediente } = require('../models');
const AlertasService = require('../services/AlertasService');
const sequelize = require('../config/database');

exports.listarIngredientes = async (req, res) => {
  try {
    const { categoria, search } = req.query;
    const where = {};

    if (categoria) where.categoria = categoria;
    if (search) {
      where.nombre_ing = { [Op.iLike]: `%${search}%` };
    }

    const ingredientes = await Ingrediente.findAll({
      where,
      order: [['nombre_ing', 'ASC']],
    });

    res.json({ status: 'success', data: ingredientes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar ingredientes' });
  }
};

exports.crearIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.create(req.body);
    res.status(201).json({ status: 'success', data: ingrediente });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al crear ingrediente' });
  }
};

exports.listarLotes = async (req, res) => {
  try {
    const { id_ingrediente } = req.query;
    const where = {};
    if (id_ingrediente) where.id_ingrediente = id_ingrediente;

    const lotes = await LoteIngrediente.findAll({
      where,
      include: [{ model: Ingrediente }],
      order: [['fecha_venc', 'ASC']],
    });

    res.json({ status: 'success', data: lotes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar lotes' });
  }
};

exports.crearLote = async (req, res) => {
  try {
    const { fecha_venc, fecha_ingreso } = req.body;

    if (new Date(fecha_venc) < new Date(fecha_ingreso)) {
      return res.status(400).json({
        status: 'error',
        message: 'La fecha de vencimiento debe ser posterior a la fecha de ingreso',
      });
    }

    const lote = await LoteIngrediente.create({
      ...req.body,
      cantidad_inicial: req.body.cantidad_actual,
    });

    res.status(201).json({ status: 'success', data: lote });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al crear lote' });
  }
};

exports.ajustarInventario = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id_lote, nueva_cantidad, motivo } = req.body;

    const lote = await LoteIngrediente.findByPk(id_lote, { transaction });
    if (!lote) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Lote no encontrado' });
    }

    const diferencia = Math.abs(parseFloat(lote.cantidad_actual) - parseFloat(nueva_cantidad));
    const porcentajeDiferencia = (diferencia / parseFloat(lote.cantidad_inicial)) * 100;

    lote.cantidad_actual = nueva_cantidad;
    await lote.save({ transaction });

    await transaction.commit();

    res.json({
      status: 'success',
      data: {
        lote,
        anomalia: porcentajeDiferencia > 20 ? {
          tipo: 'AJUSTE_SIGNIFICATIVO',
          mensaje: `Ajuste de ${diferencia.toFixed(2)} unidades (${porcentajeDiferencia.toFixed(1)}% del total)`,
        } : null,
      },
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al ajustar inventario' });
  }
};

exports.actualizarIngrediente = async (req, res) => {
  try {
    const ingrediente = await Ingrediente.findByPk(req.params.id);
    if (!ingrediente) {
      return res.status(404).json({ status: 'error', message: 'Ingrediente no encontrado' });
    }
    await ingrediente.update(req.body);
    res.json({ status: 'success', data: ingrediente });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al actualizar ingrediente' });
  }
};

exports.alertas = async (req, res) => {
  try {
    const alertasVencimiento = await AlertasService.getAlertasVencimiento();
    const stockBajo = await AlertasService.getStockBajo();

    res.json({
      status: 'success',
      data: {
        proximosAVencer: alertasVencimiento,
        stockBajo,
        totalAlertas: alertasVencimiento.length + stockBajo.length,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener alertas' });
  }
};
