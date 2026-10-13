process.env.DB_DIALECT = 'sqlite';
process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { sequelize, Ingrediente, LoteIngrediente } = require('../src/models');
const AlertasService = require('../src/services/AlertasService');

test('AlertasService - getStockBajo', async (t) => {
  before(async () => {
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

  after(async () => {
    await sequelize.close();
  });

  await t.test('returns correct stock bajo items with expected keys and types', async () => {
    const stockBajo = await AlertasService.getStockBajo();

    assert.equal(stockBajo.length, 3);

    const ids = stockBajo.map((item) => item.id_ingrediente).sort((a, b) => a - b);
    assert.deepEqual(ids, [1, 3, 4]);

    for (const item of stockBajo) {
      assert.equal(typeof item.id_ingrediente, 'number');
      assert.equal(typeof item.nombre, 'string');
      assert.equal(typeof item.stockActual, 'number');
      assert.equal(typeof item.stockMinimo, 'number');
      assert.equal(typeof item.unidad, 'string');
    }

    const harina = stockBajo.find((item) => item.id_ingrediente === 1);
    assert.equal(harina.nombre, 'Harina');
    assert.equal(harina.stockActual, 15);
    assert.equal(harina.stockMinimo, 20);
    assert.equal(harina.unidad, 'Kg');

    const cacao = stockBajo.find((item) => item.id_ingrediente === 3);
    assert.equal(cacao.nombre, 'Cacao');
    assert.equal(cacao.stockActual, 0);
    assert.equal(cacao.stockMinimo, 5);

    const vainilla = stockBajo.find((item) => item.id_ingrediente === 4);
    assert.equal(vainilla.nombre, 'Vainilla');
    assert.equal(vainilla.stockActual, 0);
    assert.equal(vainilla.stockMinimo, 2);
  });
});
