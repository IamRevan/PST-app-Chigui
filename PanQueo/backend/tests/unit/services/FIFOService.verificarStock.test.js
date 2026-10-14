const { Sequelize, DataTypes } = require('sequelize');

const mockSequelize = new Sequelize('sqlite::memory:', { logging: false });

const mockIngrediente = mockSequelize.define('Ingrediente', {
  id_ingrediente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_ing: { type: DataTypes.STRING, allowNull: false },
  stock_minimo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  unidad_medida: { type: DataTypes.STRING, defaultValue: 'kg' },
}, { tableName: 'ingredientes', underscored: true });

const mockRecetaIngrediente = mockSequelize.define('RecetaIngrediente', {
  id_receta_ing: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_receta: { type: DataTypes.INTEGER, allowNull: false },
  id_ingrediente: { type: DataTypes.INTEGER, allowNull: false },
  cantidad_requerida: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'receta_ingredientes', underscored: true });

const mockLoteIngrediente = mockSequelize.define('LoteIngrediente', {
  id_lote: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ingrediente: { type: DataTypes.INTEGER, allowNull: false },
  cantidad_actual: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cantidad_inicial: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_ingreso: { type: DataTypes.DATEONLY, defaultValue: '2025-01-01' },
  fecha_venc: { type: DataTypes.DATEONLY, defaultValue: '2026-01-01' },
}, { tableName: 'lotes_ingredientes', underscored: true });

mockRecetaIngrediente.belongsTo(mockIngrediente, { foreignKey: 'id_ingrediente' });
mockIngrediente.hasMany(mockRecetaIngrediente, { foreignKey: 'id_ingrediente' });
mockLoteIngrediente.belongsTo(mockIngrediente, { foreignKey: 'id_ingrediente' });
mockIngrediente.hasMany(mockLoteIngrediente, { foreignKey: 'id_ingrediente' });

jest.mock('../../../src/models', () => ({
  sequelize: mockSequelize,
  Ingrediente: mockIngrediente,
  RecetaIngrediente: mockRecetaIngrediente,
  LoteIngrediente: mockLoteIngrediente,
  Pedido: {},
}));

const FIFOService = require('../../../src/services/FIFOService');

describe('FIFOService.verificarStockSuficiente', () => {
  beforeEach(async () => {
    await mockSequelize.sync({ force: true });
  });

  afterAll(async () => {
    await mockSequelize.close();
  });

  test('debe retornar suficiente: true y detalles vacíos si la receta no tiene ingredientes', async () => {
    const res = await FIFOService.verificarStockSuficiente(999);
    expect(res).toEqual({
      suficiente: true,
      detalles: [],
    });
  });

  test('debe calcular correctamente el stock disponible agrupado por ingrediente', async () => {
    const ing1 = await mockIngrediente.create({ nombre_ing: 'Harina' });
    const ing2 = await mockIngrediente.create({ nombre_ing: 'Azúcar' });

    await mockRecetaIngrediente.create({ id_receta: 1, id_ingrediente: ing1.id_ingrediente, cantidad_requerida: 10.0 });
    await mockRecetaIngrediente.create({ id_receta: 1, id_ingrediente: ing2.id_ingrediente, cantidad_requerida: 5.0 });

    // Lotes Harina (15 en total)
    await mockLoteIngrediente.create({ id_ingrediente: ing1.id_ingrediente, cantidad_actual: 10.0, cantidad_inicial: 10.0 });
    await mockLoteIngrediente.create({ id_ingrediente: ing1.id_ingrediente, cantidad_actual: 5.0, cantidad_inicial: 5.0 });

    // Lotes Azúcar (2 en total - insuficiente)
    await mockLoteIngrediente.create({ id_ingrediente: ing2.id_ingrediente, cantidad_actual: 2.0, cantidad_inicial: 2.0 });

    const res = await FIFOService.verificarStockSuficiente(1);

    expect(res.suficiente).toBe(false);
    expect(res.detalles).toHaveLength(2);

    expect(typeof res.detalles[0].requerido).toBe('number');
    expect(typeof res.detalles[0].disponible).toBe('number');

    expect(res.detalles[0]).toEqual({
      ingrediente: 'Harina',
      requerido: 10.0,
      disponible: 15.0,
      suficiente: true,
    });

    expect(res.detalles[1]).toEqual({
      ingrediente: 'Azúcar',
      requerido: 5.0,
      disponible: 2.0,
      suficiente: false,
    });
  });

  test('debe evaluar disponible en 0 si un ingrediente de la receta no tiene lotes', async () => {
    const ing1 = await mockIngrediente.create({ nombre_ing: 'Sal' });
    await mockRecetaIngrediente.create({ id_receta: 2, id_ingrediente: ing1.id_ingrediente, cantidad_requerida: 1.0 });

    const res = await FIFOService.verificarStockSuficiente(2);

    expect(res.suficiente).toBe(false);
    expect(res.detalles[0]).toEqual({
      ingrediente: 'Sal',
      requerido: 1.0,
      disponible: 0,
      suficiente: false,
    });
  });
});
