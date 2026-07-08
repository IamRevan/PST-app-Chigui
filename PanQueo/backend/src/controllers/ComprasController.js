const { ListaCompra, DetalleListaCompra, Ingrediente, LoteIngrediente } = require('../models');
const sequelize = require('../config/database');

exports.listarListas = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estado_lista = estado;

    const listas = await ListaCompra.findAll({
      where,
      include: [{
        model: DetalleListaCompra,
        include: [{ model: Ingrediente }],
      }],
      order: [['fecha_creacion', 'DESC']],
    });

    res.json({ status: 'success', data: listas });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al listar compras' });
  }
};

exports.crearLista = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { detalles, ...data } = req.body;

    const lista = await ListaCompra.create(data, { transaction });

    if (detalles && detalles.length > 0) {
      const detalleData = detalles.map((d) => ({
        id_lista: lista.id_lista,
        id_ingrediente: d.id_ingrediente,
        cantidad_sugerida: d.cantidad_sugerida,
        precio_estimado_unitario: d.precio_estimado_unitario,
      }));
      await DetalleListaCompra.bulkCreate(detalleData, { transaction });
    }

    await transaction.commit();

    const listaCompleta = await ListaCompra.findByPk(lista.id_lista, {
      include: [{ model: DetalleListaCompra, include: [{ model: Ingrediente }] }],
    });

    res.status(201).json({ status: 'success', data: listaCompleta });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al crear lista de compras' });
  }
};

exports.actualizarLista = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { estado_lista, observaciones } = req.body;
    const lista = await ListaCompra.findByPk(req.params.id, { transaction });

    if (!lista) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Lista no encontrada' });
    }

    if (estado_lista) lista.estado_lista = estado_lista;
    if (observaciones !== undefined) lista.observaciones = observaciones;
    await lista.save({ transaction });

    await transaction.commit();
    res.json({ status: 'success', data: lista });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al actualizar lista' });
  }
};

exports.completarLista = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const lista = await ListaCompra.findByPk(req.params.id, {
      include: [{ model: DetalleListaCompra }],
      transaction,
    });

    if (!lista) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Lista no encontrada' });
    }

    lista.estado_lista = 'Completada';
    await lista.save({ transaction });

    // Crear lotes basados en items comprados
    for (const detalle of lista.DetalleListaCompra) {
      if (parseFloat(detalle.cantidad_comprada) > 0) {
        await LoteIngrediente.create({
          id_ingrediente: detalle.id_ingrediente,
          cantidad_actual: detalle.cantidad_comprada,
          cantidad_inicial: detalle.cantidad_comprada,
          fecha_ingreso: new Date(),
          fecha_venc: new Date(new Date().setMonth(new Date().getMonth() + 6)),
          precio_compra_unitario: detalle.precio_estimado_unitario,
        }, { transaction });
      }
    }

    await transaction.commit();
    res.json({ status: 'success', data: lista });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al completar lista' });
  }
};
