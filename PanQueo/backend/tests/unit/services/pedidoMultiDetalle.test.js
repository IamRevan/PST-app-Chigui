process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
// DB en memoria: los tests NUNCA deben tocar el database.sqlite de desarrollo
process.env.DB_STORAGE = ':memory:';

const { sequelize, Pedido, Receta, Ingrediente, RecetaIngrediente, LoteIngrediente, Cliente, DetallePedido } = require('../../../src/models');
const fifoService = require('../../../src/services/FIFOService');

describe('FIFOService - Pedidos multi-receta (pedido_detalles) e idempotencia', () => {
  let cliente;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    cliente = await Cliente.create({
      nombre: 'Maria',
      apellido: 'Lujan',
      cedula: 'V-99887766',
      telefono: '04141234567',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('agrega requerimientos cuando dos recetas del pedido comparten un ingrediente', async () => {
    const ing = await Ingrediente.create({ nombre_ing: 'Harina', unidad_medida: 'Kg' });
    const receta1 = await Receta.create({ nombre_receta: 'Pan Canilla', instrucciones: 'x' });
    const receta2 = await Receta.create({ nombre_receta: 'Pan Dulce', instrucciones: 'x' });

    // receta1 necesita 10, receta2 necesita 5 -> total requerido 15 de Harina
    await RecetaIngrediente.create({ id_receta: receta1.id_receta, id_ingrediente: ing.id_ingrediente, cantidad_requerida: 10 });
    await RecetaIngrediente.create({ id_receta: receta2.id_receta, id_ingrediente: ing.id_ingrediente, cantidad_requerida: 5 });

    const loteViejo = await LoteIngrediente.create({
      id_ingrediente: ing.id_ingrediente, cantidad_inicial: 8, cantidad_actual: 8,
      fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-10',
    });
    const loteNuevo = await LoteIngrediente.create({
      id_ingrediente: ing.id_ingrediente, cantidad_inicial: 10, cantidad_actual: 10,
      fecha_ingreso: '2025-01-02', fecha_venc: '2025-06-10',
    });

    const pedido = await Pedido.create({
      id_cliente: cliente.id_cliente, fecha_entrega: '2025-02-01', costo_total: 40,
    });
    await DetallePedido.bulkCreate([
      { id_pedido: pedido.id_pedido, id_receta: receta1.id_receta, cantidad: 1, precio_unitario: 25 },
      { id_pedido: pedido.id_pedido, id_receta: receta2.id_receta, cantidad: 1, precio_unitario: 15 },
    ]);

    const res = await fifoService.consumirIngredientes(pedido.id_pedido);
    expect(res.success).toBe(true);

    await loteViejo.reload();
    await loteNuevo.reload();
    // FIFO: primero se agota el lote con fecha_venc mas proxima (8), y el resto (7) del siguiente
    expect(parseFloat(loteViejo.cantidad_actual)).toBe(0);
    expect(parseFloat(loteNuevo.cantidad_actual)).toBe(3);

    await pedido.reload();
    expect(pedido.estado_entrega).toBe('En Cocina');
  });

  it('multiplica el requerimiento por la cantidad de cada detalle', async () => {
    const ing = await Ingrediente.create({ nombre_ing: 'Levadura', unidad_medida: 'Kg' });
    const receta = await Receta.create({ nombre_receta: 'Pan Dulce', instrucciones: 'x' });
    await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing.id_ingrediente, cantidad_requerida: 2 });

    await LoteIngrediente.create({
      id_ingrediente: ing.id_ingrediente, cantidad_inicial: 6, cantidad_actual: 6,
      fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-10',
    });

    const pedido = await Pedido.create({ id_cliente: cliente.id_cliente, fecha_entrega: '2025-02-01', costo_total: 30 });
    await DetallePedido.create({ id_pedido: pedido.id_pedido, id_receta: receta.id_receta, cantidad: 2, precio_unitario: 15 });

    // cantidad 2 x 2 kg = 4 kg requeridos (de 6 disponibles)
    const res = await fifoService.consumirIngredientes(pedido.id_pedido);
    expect(res.success).toBe(true);

    const [lote] = await LoteIngrediente.findAll();
    expect(parseFloat(lote.cantidad_actual)).toBe(2);
  });

  it('no vuelve a consumir si el pedido ya esta En Cocina (idempotencia / Regla 1)', async () => {
    const ing = await Ingrediente.create({ nombre_ing: 'Azucar', unidad_medida: 'Kg' });
    const receta = await Receta.create({ nombre_receta: 'Pan Francés', instrucciones: 'x' });
    await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing.id_ingrediente, cantidad_requerida: 3 });

    const lote = await LoteIngrediente.create({
      id_ingrediente: ing.id_ingrediente, cantidad_inicial: 10, cantidad_actual: 10,
      fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-10',
    });

    const pedido = await Pedido.create({ id_cliente: cliente.id_cliente, fecha_entrega: '2025-02-01', costo_total: 20 });
    await DetallePedido.create({ id_pedido: pedido.id_pedido, id_receta: receta.id_receta, cantidad: 1, precio_unitario: 20 });

    await fifoService.consumirIngredientes(pedido.id_pedido);

    await expect(fifoService.consumirIngredientes(pedido.id_pedido))
      .rejects.toThrow('El pedido ya fue procesado a "En Cocina"');

    await lote.reload();
    // NO se desconto dos veces: sigue en 7 (10 - 3), no en 4
    expect(parseFloat(lote.cantidad_actual)).toBe(7);
  });

  it('lanza error 400-style si el stock total no cubre el requerimiento agregado (Regla 3)', async () => {
    const ing = await Ingrediente.create({ nombre_ing: 'Sal', unidad_medida: 'Kg' });
    const receta = await Receta.create({ nombre_receta: 'Pan Canilla', instrucciones: 'x' });
    await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing.id_ingrediente, cantidad_requerida: 2 });

    await LoteIngrediente.create({
      id_ingrediente: ing.id_ingrediente, cantidad_inicial: 3, cantidad_actual: 3,
      fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-10',
    });

    const pedido = await Pedido.create({ id_cliente: cliente.id_cliente, fecha_entrega: '2025-02-01', costo_total: 15 });
    await DetallePedido.create({ id_pedido: pedido.id_pedido, id_receta: receta.id_receta, cantidad: 3, precio_unitario: 5 });

    // Requerido 6 (2 x 3), disponible 3
    await expect(fifoService.consumirIngredientes(pedido.id_pedido))
      .rejects.toThrow('Stock insuficiente para Sal. Requerido: 6, Disponible: 3');

    const [lote] = await LoteIngrediente.findAll();
    await lote.reload();
    expect(parseFloat(lote.cantidad_actual)).toBe(3); // rollback: nada se descontó
  });

  it('mantiene compatibilidad legacy: pedido con solo id_receta (sin detalles) consume cantidad 1', async () => {
    const ing = await Ingrediente.create({ nombre_ing: 'Mantequilla', unidad_medida: 'Kg' });
    const receta = await Receta.create({ nombre_receta: 'Ponque', instrucciones: 'x' });
    await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing.id_ingrediente, cantidad_requerida: 4 });

    const lote = await LoteIngrediente.create({
      id_ingrediente: ing.id_ingrediente, cantidad_inicial: 9, cantidad_actual: 9,
      fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-10',
    });

    const pedido = await Pedido.create({
      id_cliente: cliente.id_cliente, id_receta: receta.id_receta,
      fecha_entrega: '2025-02-01', costo_total: 25,
    });

    const res = await fifoService.consumirIngredientes(pedido.id_pedido);
    expect(res.success).toBe(true);

    await lote.reload();
    expect(parseFloat(lote.cantidad_actual)).toBe(5);
  });
});
