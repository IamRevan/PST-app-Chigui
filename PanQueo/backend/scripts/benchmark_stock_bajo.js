process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
process.env.NODE_ENV = 'test';

const { performance } = require('perf_hooks');
const { sequelize, Ingrediente, LoteIngrediente } = require('../src/models');
const AlertasService = require('../src/services/AlertasService');

async function setupTestData() {
  await sequelize.sync({ force: true });

  const numIngredientes = 200;
  const ingredientesData = [];
  const lotesData = [];

  for (let i = 1; i <= numIngredientes; i++) {
    ingredientesData.push({
      id_ingrediente: i,
      nombre_ing: `Ingrediente Test ${i}`,
      stock_minimo: 20.0,
      unidad_medida: 'Kg',
    });

    // Strategy for lotes:
    // i % 4 === 0: No lotes (zero stock) -> stockActual = 0 <= stockMinimo (20) -> should be included in stockBajo
    // i % 4 === 1: 1 lote with cantidad_actual = 0 -> stockActual = 0 <= 20 -> should be included
    // i % 4 === 2: 3 lotes with sum = 15 -> stockActual = 15 <= 20 -> should be included
    // i % 4 === 3: 3 lotes with sum = 50 -> stockActual = 50 > 20 -> NOT included
    if (i % 4 === 1) {
      lotesData.push({
        id_ingrediente: i,
        cantidad_actual: 0,
        cantidad_inicial: 10,
        fecha_ingreso: '2025-01-01',
        fecha_venc: '2025-12-31',
      });
    } else if (i % 4 === 2) {
      lotesData.push(
        { id_ingrediente: i, cantidad_actual: 5, cantidad_inicial: 10, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' },
        { id_ingrediente: i, cantidad_actual: 5, cantidad_inicial: 10, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' },
        { id_ingrediente: i, cantidad_actual: 5, cantidad_inicial: 10, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' }
      );
    } else if (i % 4 === 3) {
      lotesData.push(
        { id_ingrediente: i, cantidad_actual: 20, cantidad_inicial: 20, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' },
        { id_ingrediente: i, cantidad_actual: 15, cantidad_inicial: 20, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' },
        { id_ingrediente: i, cantidad_actual: 15, cantidad_inicial: 20, fecha_ingreso: '2025-01-01', fecha_venc: '2025-12-31' }
      );
    }
  }

  await Ingrediente.bulkCreate(ingredientesData);
  await LoteIngrediente.bulkCreate(lotesData);
}

async function runBenchmark() {
  console.log('--- Setting up benchmark database ---');
  await setupTestData();

  let queryCount = 0;
  sequelize.options.logging = () => { queryCount++; };

  console.log('--- Running baseline check & correctness verification ---');
  queryCount = 0;
  const result = await AlertasService.getStockBajo();
  const queryCountSingleRun = queryCount;

  // Validate results
  console.log(`Total stock bajo items returned: ${result.length}`);
  if (result.length === 0) {
    throw new Error('Benchmark error: Expected non-zero stock bajo items');
  }

  // Validate types & structure
  const first = result[0];
  console.log('Sample item:', first);
  if (typeof first.stockActual !== 'number' || typeof first.stockMinimo !== 'number') {
    throw new Error(`Type error: stockActual (${typeof first.stockActual}) and stockMinimo (${typeof first.stockMinimo}) must be numbers`);
  }

  const expectedKeys = ['id_ingrediente', 'nombre', 'stockActual', 'stockMinimo', 'unidad'];
  for (const key of expectedKeys) {
    if (!(key in first)) {
      throw new Error(`Contract error: missing key '${key}' in returned item`);
    }
  }

  // Timed benchmark over 20 iterations
  const iterations = 20;
  queryCount = 0;
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    await AlertasService.getStockBajo();
  }
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;

  sequelize.options.logging = false;

  console.log('\n📊 BENCHMARK RESULTS 📊');
  console.log(`- Queries per invocation: ${queryCountSingleRun}`);
  console.log(`- Total queries over ${iterations} iterations: ${queryCount}`);
  console.log(`- Total time (${iterations} runs): ${totalTime.toFixed(2)} ms`);
  console.log(`- Avg time per run: ${avgTime.toFixed(2)} ms`);

  await sequelize.close();
  return { queryCount: queryCountSingleRun, avgTime, totalTime, resultCount: result.length };
}

if (require.main === module) {
  runBenchmark().catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}

module.exports = { setupTestData, runBenchmark };
