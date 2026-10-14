process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';

const { sequelize, Pedido, Receta, Ingrediente, RecetaIngrediente, LoteIngrediente, Cliente } = require('../../../src/models');
const fifoService = require('../../../src/services/FIFOService');

describe('FIFOService Unit Tests', () => {
  let cliente;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    cliente = await Cliente.create({
      nombre: 'Juan',
      apellido: 'Perez',
      cedula: 'V-12345678',
      telefono: '04121234567',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('consumirIngredientes', () => {
    it('should consume ingredients from lotes in FIFO order based on fecha_venc ASC', async () => {
      // Setup Data
      const receta = await Receta.create({ nombre_receta: 'Pan Canilla', instrucciones: 'Delicioso pan' });
      const ing1 = await Ingrediente.create({ nombre_ing: 'Harina', unidad_medida: 'Kg' });
      const ing2 = await Ingrediente.create({ nombre_ing: 'Levadura', unidad_medida: 'Kg' });

      await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing1.id_ingrediente, cantidad_requerida: 15.0 });
      await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing2.id_ingrediente, cantidad_requerida: 2.0 });

      // Lotes for ing1 (Harina): Lote 1 (fecha_venc: 2025-05-10, qty: 10), Lote 2 (fecha_venc: 2025-06-10, qty: 10)
      const loteH1 = await LoteIngrediente.create({
        id_ingrediente: ing1.id_ingrediente,
        cantidad_inicial: 10,
        cantidad_actual: 10,
        fecha_ingreso: '2025-01-01',
        fecha_venc: '2025-05-10',
      });

      const loteH2 = await LoteIngrediente.create({
        id_ingrediente: ing1.id_ingrediente,
        cantidad_inicial: 10,
        cantidad_actual: 10,
        fecha_ingreso: '2025-01-02',
        fecha_venc: '2025-06-10',
      });

      // Lote for ing2 (Levadura)
      const loteL1 = await LoteIngrediente.create({
        id_ingrediente: ing2.id_ingrediente,
        cantidad_inicial: 5,
        cantidad_actual: 5,
        fecha_ingreso: '2025-01-01',
        fecha_venc: '2025-08-10',
      });

      const pedido = await Pedido.create({
        id_cliente: cliente.id_cliente,
        id_receta: receta.id_receta,
        fecha_entrega: '2025-02-01',
        costo_total: 100,
        estado_entrega: 'Por Preparar',
      });

      const res = await fifoService.consumirIngredientes(pedido.id_pedido);
      expect(res.success).toBe(true);

      // Verify Lotes
      await loteH1.reload();
      await loteH2.reload();
      await loteL1.reload();

      expect(parseFloat(loteH1.cantidad_actual)).toBe(0); // 10 consumed from oldest lote
      expect(parseFloat(loteH2.cantidad_actual)).toBe(5); // 5 consumed from second lote (10 - 5 = 5 remaining)
      expect(parseFloat(loteL1.cantidad_actual)).toBe(3); // 2 consumed from levadura lote (5 - 2 = 3 remaining)

      // Verify Pedido
      await pedido.reload();
      expect(pedido.estado_entrega).toBe('En Cocina');
    });

    it('should throw error and rollback transaction if stock is insufficient for any ingredient', async () => {
      const receta = await Receta.create({ nombre_receta: 'Pan Dulce', instrucciones: 'Pan especial' });
      const ing1 = await Ingrediente.create({ nombre_ing: 'Azúcar', unidad_medida: 'Kg' });

      await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing1.id_ingrediente, cantidad_requerida: 10.0 });

      const loteA1 = await LoteIngrediente.create({
        id_ingrediente: ing1.id_ingrediente,
        cantidad_inicial: 4,
        cantidad_actual: 4,
        fecha_ingreso: '2025-01-01',
        fecha_venc: '2025-05-10',
      });

      const pedido = await Pedido.create({
        id_cliente: cliente.id_cliente,
        id_receta: receta.id_receta,
        fecha_entrega: '2025-02-01',
        costo_total: 50,
        estado_entrega: 'Por Preparar',
      });

      await expect(fifoService.consumirIngredientes(pedido.id_pedido)).rejects.toThrow(
        'Stock insuficiente para Azúcar. Requerido: 10, Disponible: 4'
      );

      // Verify lotes unchanged
      await loteA1.reload();
      expect(parseFloat(loteA1.cantidad_actual)).toBe(4);

      // Verify Pedido unchanged
      await pedido.reload();
      expect(pedido.estado_entrega).toBe('Por Preparar');
    });
  });

  describe('verificarStockSuficiente', () => {
    it('should correctly verify stock sufficiency across ingredients', async () => {
      const receta = await Receta.create({ nombre_receta: 'Pan Francés', instrucciones: 'Pan clasico' });
      const ing1 = await Ingrediente.create({ nombre_ing: 'Harina F', unidad_medida: 'Kg' });
      const ing2 = await Ingrediente.create({ nombre_ing: 'Sal', unidad_medida: 'Kg' });

      await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing1.id_ingrediente, cantidad_requerida: 5.0 });
      await RecetaIngrediente.create({ id_receta: receta.id_receta, id_ingrediente: ing2.id_ingrediente, cantidad_requerida: 2.0 });

      await LoteIngrediente.create({
        id_ingrediente: ing1.id_ingrediente,
        cantidad_inicial: 10,
        cantidad_actual: 10,
        fecha_ingreso: '2025-01-01',
        fecha_venc: '2025-05-10',
      });

      // Sal has only 1.0 in stock, requiring 2.0
      await LoteIngrediente.create({
        id_ingrediente: ing2.id_ingrediente,
        cantidad_inicial: 1,
        cantidad_actual: 1,
        fecha_ingreso: '2025-01-01',
        fecha_venc: '2025-05-10',
      });

      const res = await fifoService.verificarStockSuficiente(receta.id_receta);
      expect(res.suficiente).toBe(false);
      expect(res.detalles).toHaveLength(2);

      const harinaDetail = res.detalles.find(d => d.ingrediente === 'Harina F');
      expect(harinaDetail.requerido).toBe(5);
      expect(harinaDetail.disponible).toBe(10);
      expect(harinaDetail.suficiente).toBe(true);

      const salDetail = res.detalles.find(d => d.ingrediente === 'Sal');
      expect(salDetail.requerido).toBe(2);
      expect(salDetail.disponible).toBe(1);
      expect(salDetail.suficiente).toBe(false);
    });
  });
});
