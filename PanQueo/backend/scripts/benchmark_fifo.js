process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';

const { sequelize, Pedido, Receta, Ingrediente, RecetaIngrediente, LoteIngrediente, Cliente } = require('../src/models');
const fifoService = require('../src/services/FIFOService');

let queryCount = 0;

// Log function to count SQL queries
function trackQueries() {
  queryCount = 0;
  sequelize.options.logging = () => {
    queryCount++;
  };
}

function resetQueryCount() {
  queryCount = 0;
}

function getQueryCount() {
  return queryCount;
}

async function setupBenchmarkData(numIngredients = 20, lotesPerIngredient = 5) {
  await sequelize.sync({ force: true });

  const cliente = await Cliente.create({
    nombre: 'Benchmark',
    apellido: 'Tester',
    cedula: 'V-0000000',
    telefono: '00000000',
  });

  const receta = await Receta.create({
    nombre_receta: 'Benchmark Recipe',
    instrucciones: 'Complex recipe for benchmarking',
  });

  const pedido = await Pedido.create({
    id_cliente: cliente.id_cliente,
    id_receta: receta.id_receta,
    fecha_entrega: '2025-12-31',
    costo_total: 500,
    estado_entrega: 'Por Preparar',
  });

  for (let i = 1; i <= numIngredients; i++) {
    const ing = await Ingrediente.create({
      nombre_ing: `Ingrediente ${i}`,
      unidad_medida: 'Kg',
    });

    await RecetaIngrediente.create({
      id_receta: receta.id_receta,
      id_ingrediente: ing.id_ingrediente,
      cantidad_requerida: 10,
    });

    for (let j = 1; j <= lotesPerIngredient; j++) {
      await LoteIngrediente.create({
        id_ingrediente: ing.id_ingrediente,
        cantidad_inicial: 5,
        cantidad_actual: 5,
        fecha_ingreso: '2025-01-01',
        fecha_venc: `2025-0${(j % 9) + 1}-10`,
      });
    }
  }

  return { pedido, receta };
}

async function runBenchmark() {
  console.log('--- FIFOService Performance Benchmark ---');

  // Benchmark verificarStockSuficiente
  const { receta } = await setupBenchmarkData(20, 5);
  trackQueries();
  const startStock = process.hrtime.bigint();
  await fifoService.verificarStockSuficiente(receta.id_receta);
  const endStock = process.hrtime.bigint();
  const queriesStock = getQueryCount();
  const timeStockMs = Number(endStock - startStock) / 1e6;

  console.log(`[verificarStockSuficiente] Time: ${timeStockMs.toFixed(2)} ms | Queries: ${queriesStock}`);

  // Benchmark consumirIngredientes
  const { pedido } = await setupBenchmarkData(20, 5);
  trackQueries();
  const startConsumir = process.hrtime.bigint();
  await fifoService.consumirIngredientes(pedido.id_pedido);
  const endConsumir = process.hrtime.bigint();
  const queriesConsumir = getQueryCount();
  const timeConsumirMs = Number(endConsumir - startConsumir) / 1e6;

  console.log(`[consumirIngredientes] Time: ${timeConsumirMs.toFixed(2)} ms | Queries: ${queriesConsumir}`);

  await sequelize.close();
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runBenchmark };
