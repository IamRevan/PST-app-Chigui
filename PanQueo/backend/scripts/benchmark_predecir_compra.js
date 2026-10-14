const AsistenteService = require('../src/services/AsistenteService');
const models = require('../src/models');

// Helper to simulate DB delay
const DB_LATENCY_MS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBenchmark() {
  console.log('⚡ Starting Benchmark for AsistenteService.predecirCompra...');

  // Setup synthetic dataset with 50 ingredients
  const NUM_INGREDIENTS = 50;
  const ingredientsData = [];
  const lotesSumData = {};
  const consumoData = {};

  for (let i = 1; i <= NUM_INGREDIENTS; i++) {
    ingredientsData.push({
      id_ingrediente: i,
      nombre_ing: `Ingrediente ${i}`,
      stock_minimo: "10.00",
    });
    // Random stock 0..20
    lotesSumData[i] = (i % 3 === 0) ? 5 : 25;
    consumoData[i] = (i % 2 === 0) ? "14.00" : "0.00";
  }

  const pedidosCount = 7;

  let queryCount = 0;

  // Track queries and simulate network/DB delay
  const trackedFn = (fn) => async (...args) => {
    queryCount++;
    await sleep(DB_LATENCY_MS);
    return fn(...args);
  };

  // Mock model implementations
  models.Ingrediente.findAll = trackedFn(async () => ingredientsData);

  models.LoteIngrediente.sum = trackedFn(async (col, options) => {
    const id = options?.where?.id_ingrediente;
    return lotesSumData[id] || 0;
  });

  models.LoteIngrediente.findAll = trackedFn(async (options) => {
    // If grouped query
    if (options && options.group) {
      return Object.entries(lotesSumData).map(([id, sum]) => ({
        id_ingrediente: parseInt(id, 10),
        stockActual: sum,
        get: (key) => (key === 'stockActual' ? sum : undefined),
      }));
    }
    return [];
  });

  models.RecetaIngrediente.findOne = trackedFn(async (options) => {
    const id = options?.where?.id_ingrediente;
    return { total_consumido: consumoData[id] || 0 };
  });

  models.RecetaIngrediente.findAll = trackedFn(async (options) => {
    if (options && options.group) {
      return Object.entries(consumoData).map(([id, total]) => ({
        id_ingrediente: parseInt(id, 10),
        totalConsumido: parseFloat(total),
        get: (key) => (key === 'totalConsumido' ? parseFloat(total) : undefined),
      }));
    }
    return [];
  });

  models.Pedido.count = trackedFn(async () => pedidosCount);

  // Measure initial baseline run
  queryCount = 0;
  const startTime = Date.now();
  const predictions = await AsistenteService.predecirCompra();
  const endTime = Date.now();

  const totalQueries = queryCount;
  const executionTimeMs = endTime - startTime;

  console.log(`\n📊 Baseline Results (${NUM_INGREDIENTS} ingredients):`);
  console.log(` - Total DB Queries: ${totalQueries}`);
  console.log(` - Execution Time: ${executionTimeMs} ms`);
  console.log(` - Predictions count returned: ${predictions.length}`);

  return {
    numIngredients: NUM_INGREDIENTS,
    queries: totalQueries,
    timeMs: executionTimeMs,
  };
}

if (require.main === module) {
  runBenchmark().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runBenchmark };
