const { Receta, RecetaIngrediente, Ingrediente } = require('../models');
const AsistenteService = require('../services/AsistenteService');
const sequelize = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const recetas = await Receta.findAll({
      include: [{
        model: RecetaIngrediente,
        include: [{ model: Ingrediente }],
      }],
      order: [['nombre_receta', 'ASC']],
    });
    res.json({ status: 'success', data: recetas });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar recetas' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const receta = await Receta.findByPk(req.params.id, {
      include: [{
        model: RecetaIngrediente,
        include: [{ model: Ingrediente }],
      }],
    });
    if (!receta) {
      return res.status(404).json({ status: 'error', message: 'Receta no encontrada' });
    }
    res.json({ status: 'success', data: receta });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener receta' });
  }
};

exports.crear = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { ingredientes, ...data } = req.body;

    const receta = await Receta.create(data, { transaction });

    if (ingredientes && ingredientes.length > 0) {
      const recetaIngs = ingredientes.map((ing) => ({
        id_receta: receta.id_receta,
        id_ingrediente: ing.id_ingrediente,
        cantidad_requerida: ing.cantidad_requerida,
      }));
      await RecetaIngrediente.bulkCreate(recetaIngs, { transaction });
    }

    await transaction.commit();

    const recetaCompleta = await Receta.findByPk(receta.id_receta, {
      include: [{ model: RecetaIngrediente, include: [{ model: Ingrediente }] }],
    });

    res.status(201).json({ status: 'success', data: recetaCompleta });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al crear receta' });
  }
};

exports.simularCosto = async (req, res) => {
  try {
    const resultado = await AsistenteService.sugerirPrecios(req.params.id);
    res.json({ status: 'success', data: resultado });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al simular costos' });
  }
};

exports.actualizar = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { ingredientes, ...data } = req.body;
    const receta = await Receta.findByPk(req.params.id, { transaction });

    if (!receta) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Receta no encontrada' });
    }

    await receta.update(data, { transaction });

    if (ingredientes) {
      await RecetaIngrediente.destroy({ where: { id_receta: receta.id_receta }, transaction });
      const recetaIngs = ingredientes.map((ing) => ({
        id_receta: receta.id_receta,
        id_ingrediente: ing.id_ingrediente,
        cantidad_requerida: ing.cantidad_requerida,
      }));
      await RecetaIngrediente.bulkCreate(recetaIngs, { transaction });
    }

    await transaction.commit();

    const recetaCompleta = await Receta.findByPk(receta.id_receta, {
      include: [{ model: RecetaIngrediente, include: [{ model: Ingrediente }] }],
    });

    res.json({ status: 'success', data: recetaCompleta });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al actualizar receta' });
  }
};

exports.verificarStock = async (req, res) => {
  try {
    const FIFOService = require('../services/FIFOService');
    const resultado = await FIFOService.verificarStockSuficiente(req.params.id);
    res.json({ status: 'success', data: resultado });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al verificar stock' });
  }
};
