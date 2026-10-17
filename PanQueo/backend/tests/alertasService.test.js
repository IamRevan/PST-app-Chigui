process.env.DB_DIALECT = 'sqlite';
process.env.NODE_ENV = 'test';
// DB en memoria: los tests NUNCA deben tocar el database.sqlite de desarrollo
process.env.DB_STORAGE = ':memory:';

const { sequelize, Ingrediente, LoteIngrediente } = require('../src/models');
const AlertasService = require('../src/services/AlertasService');

describe('AlertasService - getStockBajo', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Seed test ingredients:
    // 1. "Harina": stock_minimo 20, lotes total 15 -> stockBajo
    await Ingrediente.create({ id_ingrediente: 1, nombre_ing: 'Harina', stock_minimo: 20, unidad_medida: 'Kg' });
    await LoteIngrediente.create({ id_ingrediente: 1, cantidad_actual: 10, cantidad_inicial: 10, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' });
    await LoteIngrediente.create({ id_ingrediente: 1, cantidad_actual: 5, cantidad_inicial: 10, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' });

    // 2. "Azucar": stock_minimo 10, lotes total 25 -> NOT stockBajo
    await Ingrediente.create({ id_ingrediente: 2, nombre_ing: 'Azucar', stock_minimo: 10, unidad_medida: 'Kg' });
    await LoteIngrediente.create({ id_ingrediente: 2, cantidad_actual: 25, cantidad_inicial: 30, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' });

    // 3. "Cacao": stock_minimo 5, 0 lotes -> stockBajo (stockActual = 0)
    await Ingrediente.create({ id_ingrediente: 3, nombre_ing: 'Cacao', stock_minimo: 5, unidad_medida: 'Kg' });

    // 4. "Vainilla": stock_minimo 2, 1 lote with 0 stock -> stockBajo (stockActual = 0)
    await Ingrediente.create({ id_ingrediente: 4, nombre_ing: 'Vainilla', stock_minimo: 2, unidad_medida: 'L' });
    await LoteIngrediente.create({ id_ingrediente: 4, cantidad_actual: 0, cantidad_inicial: 5, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns correct stock bajo items with expected keys and types', async () => {
    const stockBajo = await AlertasService.getStockBajo();

    expect(stockBajo.length).toBe(3);

    const ids = stockBajo.map((item) => item.id_ingrediente).sort((a, b) => a - b);
    expect(ids).toEqual([1, 3, 4]);

    for (const item of stockBajo) {
      expect(typeof item.id_ingrediente).toBe('number');
      expect(typeof item.nombre).toBe('string');
      expect(typeof item.stockActual).toBe('number');
      expect(typeof item.stockMinimo).toBe('number');
      expect(typeof item.unidad).toBe('string');
    }

    const harina = stockBajo.find((item) => item.id_ingrediente === 1);
    expect(harina.nombre).toBe('Harina');
    expect(harina.stockActual).toBe(15);
    expect(harina.stockMinimo).toBe(20);
    expect(harina.unidad).toBe('Kg');

    const cacao = stockBajo.find((item) => item.id_ingrediente === 3);
    expect(cacao.nombre).toBe('Cacao');
    expect(cacao.stockActual).toBe(0);
    expect(cacao.stockMinimo).toBe(5);

    const vainilla = stockBajo.find((item) => item.id_ingrediente === 4);
    expect(vainilla.nombre).toBe('Vainilla');
    expect(vainilla.stockActual).toBe(0);
    expect(vainilla.stockMinimo).toBe(2);
  });
});
