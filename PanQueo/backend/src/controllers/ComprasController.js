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
    const { estado_lista, observaciones, detalles } = req.body;
    const lista = await ListaCompra.findByPk(req.params.id, { transaction });

    if (!lista) {
      await transaction.rollback();
      return res.status(404).json({ status: 'error', message: 'Lista no encontrada' });
    }

    // Regla: una lista Completada solo puede cambiar estado/observaciones
    if (lista.estado_lista === 'Completada' && detalles) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'La lista está Completada: sus ítems ya están registrados como lotes',
      });
    }

    if (estado_lista) lista.estado_lista = estado_lista;
    if (observaciones !== undefined) lista.observaciones = observaciones;
    await lista.save({ transaction });

    if (Array.isArray(detalles)) {
      // Reemplazo completo de los detalles (guardar borrador / marcar comprados)
      for (const d of detalles) {
        const cantidad = parseFloat(d.cantidad_sugerida);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: 'Cada detalle debe tener una cantidad sugerida mayor a cero',
          });
        }
      }
      await DetalleListaCompra.destroy({ where: { id_lista: lista.id_lista }, transaction });
      await DetalleListaCompra.bulkCreate(
        detalles.map((d) => ({
          id_lista: lista.id_lista,
          id_ingrediente: d.id_ingrediente,
          cantidad_sugerida: parseFloat(d.cantidad_sugerida),
          cantidad_comprada: d.cantidad_comprada != null ? parseFloat(d.cantidad_comprada) : 0,
          precio_estimado_unitario: d.precio_estimado_unitario != null ? parseFloat(d.precio_estimado_unitario) : null,
        })),
        { transaction },
      );
    }

    await transaction.commit();

    const listaCompleta = await ListaCompra.findByPk(lista.id_lista, {
      include: [{ model: DetalleListaCompra, include: [{ model: Ingrediente }] }],
    });
    res.json({ status: 'success', data: listaCompleta });
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

    // Idempotencia: no generar lotes duplicados si la lista ya fue completada
    if (lista.estado_lista === 'Completada') {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'La lista ya fue completada: los lotes ya fueron generados',
      });
    }

    lista.estado_lista = 'Completada';
    await lista.save({ transaction });

    // Crear lotes basados en items comprados.
    // Cantidad: se usa cantidad_comprada; si no fue registrada, cae a cantidad_sugerida
    // (regla 3FN: el total se calcula en runtime, no se guarda).
    const detallesLista = lista.DetalleListaCompras || [];
    const { fecha_venc } = req.body; // opcional: vencimiento sugerido desde la app
    const fechaVenc = fecha_venc
      ? new Date(fecha_venc)
      : new Date(new Date().setMonth(new Date().getMonth() + 6)); // TODO: vencimiento por ingrediente

    const lotesToCreate = [];
    for (const detalle of detallesLista) {
      const cantidad = parseFloat(detalle.cantidad_comprada) || parseFloat(detalle.cantidad_sugerida) || 0;
      if (cantidad > 0) {
        lotesToCreate.push({
          id_ingrediente: detalle.id_ingrediente,
          cantidad_actual: cantidad,
          cantidad_inicial: cantidad,
          fecha_ingreso: new Date(),
          fecha_venc: fechaVenc,
          precio_compra_unitario: detalle.precio_estimado_unitario,
        });
      }
    }

    if (lotesToCreate.length > 0) {
      await LoteIngrediente.bulkCreate(lotesToCreate, { transaction, validate: true });
    }

    await transaction.commit();
    res.json({ status: 'success', data: lista });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ status: 'error', message: 'Error al completar lista' });
  }
};
