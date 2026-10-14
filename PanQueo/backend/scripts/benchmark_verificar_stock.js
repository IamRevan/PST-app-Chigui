const { performance } = require('perf_hooks');
const { Sequelize, DataTypes, Op, fn, col } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:', { logging: false });

const Ingrediente = sequelize.define('Ingrediente', {
  id_ingrediente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_ing: { type: DataTypes.STRING, allowNull: false },
  stock_minimo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  unidad_medida: { type: DataTypes.STRING, defaultValue: 'kg' },
}, { tableName: 'ingredientes', underscored: true });

const RecetaIngrediente = sequelize.define('RecetaIngrediente', {
  id_receta_ing: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_receta: { type: DataTypes.INTEGER, allowNull: false },
  id_ingrediente: { type: DataTypes.INTEGER, allowNull: false },
  cantidad_requerida: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'receta_ingredientes', underscored: true });

const LoteIngrediente = sequelize.define('LoteIngrediente', {
  id_lote: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ingrediente: { type: DataTypes.INTEGER, allowNull: false },
  cantidad_actual: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cantidad_inicial: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_ingreso: { type: DataTypes.DATEONLY, defaultValue: '2025-01-01' },
  fecha_venc: { type: DataTypes.DATEONLY, defaultValue: '2026-01-01' },
}, { tableName: 'lotes_ingredientes', underscored: true });

RecetaIngrediente.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });
Ingrediente.hasMany(RecetaIngrediente, { foreignKey: 'id_ingrediente' });
LoteIngrediente.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });
Ingrediente.hasMany(LoteIngrediente, { foreignKey: 'id_ingrediente' });

// Original (N+1)
async function verificarStockSuficienteOriginal(idReceta) {
  const recetaIngredientes = await RecetaIngrediente.findAll({
    where: { id_receta: idReceta },
    include: [{ model: Ingrediente }],
  });

  const resultados = [];

  for (const ri of recetaIngredientes) {
    const cantidadRequerida = parseFloat(ri.cantidad_requerida);

    const stockTotal = await LoteIngrediente.sum('cantidad_actual', {
      where: {
        id_ingrediente: ri.id_ingrediente,
        cantidad_actual: { [Op.gt]: 0 },
      },
    });

    resultados.push({
      ingrediente: ri.Ingrediente?.nombre_ing || `ID ${ri.id_ingrediente}`,
      requerido: cantidadRequerida,
      disponible: parseFloat(stockTotal || 0),
      suficiente: parseFloat(stockTotal || 0) >= cantidadRequerida,
    });
  }

  return {
    suficiente: resultados.every((r) => r.suficiente),
    detalles: resultados,
  };
}

// Optimized (Group By)
async function verificarStockSuficienteOptimized(idReceta) {
  const recetaIngredientes = await RecetaIngrediente.findAll({
    where: { id_receta: idReceta },
    include: [{ model: Ingrediente }],
  });

  if (!recetaIngredientes || recetaIngredientes.length === 0) {
    return {
      suficiente: true,
      detalles: [],
    };
  }

  const ingredientIds = recetaIngredientes.map((ri) => ri.id_ingrediente);

  const lotesSum = await LoteIngrediente.findAll({
    attributes: [
      'id_ingrediente',
      [fn('SUM', col('cantidad_actual')), 'total_stock'],
    ],
    where: {
      id_ingrediente: { [Op.in]: ingredientIds },
      cantidad_actual: { [Op.gt]: 0 },
    },
    group: ['id_ingrediente'],
    raw: true,
  });

  const stockMap = new Map();
  for (const item of lotesSum) {
    stockMap.set(item.id_ingrediente, parseFloat(item.total_stock || 0));
  }

  const resultados = recetaIngredientes.map((ri) => {
    const cantidadRequerida = parseFloat(ri.cantidad_requerida);
    const disponible = stockMap.get(ri.id_ingrediente) || 0;

    return {
      ingrediente: ri.Ingrediente?.nombre_ing || `ID ${ri.id_ingrediente}`,
      requerido: cantidadRequerida,
      disponible,
      suficiente: disponible >= cantidadRequerida,
    };
  });

  return {
    suficiente: resultados.every((r) => r.suficiente),
    detalles: resultados,
  };
}

async function runBenchmark() {
  await sequelize.sync({ force: true });

  const numIngredientes = 50;
  const lotesPerIngrediente = 5;
  const idReceta = 1;

  for (let i = 1; i <= numIngredientes; i++) {
    const ing = await Ingrediente.create({
      nombre_ing: `Ingrediente ${i}`,
    });

    await RecetaIngrediente.create({
      id_receta: idReceta,
      id_ingrediente: ing.id_ingrediente,
      cantidad_requerida: (i * 10).toFixed(2),
    });

    for (let j = 1; j <= lotesPerIngrediente; j++) {
      await LoteIngrediente.create({
        id_ingrediente: ing.id_ingrediente,
        cantidad_actual: (j * 5).toFixed(2),
        cantidad_inicial: (j * 5).toFixed(2),
      });
    }
  }

  let queryCount = 0;
  sequelize.options.logging = () => { queryCount++; };

  const iterations = 100;

  // Baseline
  queryCount = 0;
  const startOriginal = performance.now();
  let resultOriginal;
  for (let i = 0; i < iterations; i++) {
    resultOriginal = await verificarStockSuficienteOriginal(idReceta);
  }
  const endOriginal = performance.now();
  const timeOriginal = endOriginal - startOriginal;
  const queriesOriginal = queryCount;

  // Optimized
  queryCount = 0;
  const startOptimized = performance.now();
  let resultOptimized;
  for (let i = 0; i < iterations; i++) {
    resultOptimized = await verificarStockSuficienteOptimized(idReceta);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;
  const queriesOptimized = queryCount;

  console.log(`\n=== BENCHMARK COMPARISON (${numIngredientes} ingredients, ${iterations} iterations) ===`);
  console.log(`Original Time  : ${timeOriginal.toFixed(2)} ms (avg: ${(timeOriginal / iterations).toFixed(2)} ms/call)`);
  console.log(`Optimized Time : ${timeOptimized.toFixed(2)} ms (avg: ${(timeOptimized / iterations).toFixed(2)} ms/call)`);
  console.log(`Speedup        : ${(timeOriginal / timeOptimized).toFixed(2)}x faster`);
  console.log(`Original Queries : ${queriesOriginal} (avg: ${queriesOriginal / iterations}/call)`);
  console.log(`Optimized Queries: ${queriesOptimized} (avg: ${queriesOptimized / iterations}/call)`);
  console.log(`Query Reduction  : ${(((queriesOriginal - queriesOptimized) / queriesOriginal) * 100).toFixed(1)}% fewer queries`);

  // Verify exact output match
  console.log('\n--- Output Verification ---');
  console.log('Results match:', JSON.stringify(resultOriginal) === JSON.stringify(resultOptimized));

  await sequelize.close();
}

runBenchmark().catch(console.error);
