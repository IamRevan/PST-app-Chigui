const { Op } = require('sequelize');

// Mock data and models for benchmark
function createMockModels(dbLatencyMs = 2) {
  let queryCount = 0;

  const mockRecetaIngredientes = Array.from({ length: 20 }, (_, i) => ({
    id_receta: 1,
    id_ingrediente: i + 1,
    cantidad_requerida: '2.5',
    Ingrediente: { nombre_ing: `Ingrediente ${i + 1}` },
  }));

  const mockLotes = [];
  for (let ingId = 1; ingId <= 20; ingId++) {
    mockLotes.push({
      id_lote: ingId * 10 + 1,
      id_ingrediente: ingId,
      precio_compra_unitario: '10.50',
      moneda: ingId % 2 === 0 ? 'USD' : 'Bs',
      fecha_ingreso: '2023-01-01',
    });
    // Add a newer lote for each ingredient
    mockLotes.push({
      id_lote: ingId * 10 + 2,
      id_ingrediente: ingId,
      precio_compra_unitario: '12.00',
      moneda: ingId % 2 === 0 ? 'USD' : 'Bs',
      fecha_ingreso: '2023-06-01',
    });
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const RecetaIngrediente = {
    async findAll(options) {
      queryCount++;
      if (dbLatencyMs > 0) await delay(dbLatencyMs);
      return mockRecetaIngredientes;
    },
  };

  const LoteIngrediente = {
    async findOne(options) {
      queryCount++;
      if (dbLatencyMs > 0) await delay(dbLatencyMs);
      const ingId = options.where.id_ingrediente;
      const lotes = mockLotes
        .filter((l) => l.id_ingrediente === ingId)
        .sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso));
      return lotes[0] || null;
    },
    async findAll(options) {
      queryCount++;
      if (dbLatencyMs > 0) await delay(dbLatencyMs);
      const ingIds = options.where?.id_ingrediente?.[Op.in] || [];
      const lotes = mockLotes
        .filter((l) => ingIds.includes(l.id_ingrediente))
        .sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso));
      return lotes;
    },
  };

  const HistorialTasaCambio = {
    async findOne() {
      queryCount++;
      if (dbLatencyMs > 0) await delay(dbLatencyMs);
      return { valor_bs_por_usd: '36.5' };
    },
  };

  return {
    RecetaIngrediente,
    LoteIngrediente,
    HistorialTasaCambio,
    getQueryCount: () => queryCount,
    resetQueryCount: () => { queryCount = 0; },
  };
}

// Original implementation for benchmark comparison
async function sugerirPreciosOriginal(idReceta, models) {
  const { RecetaIngrediente, LoteIngrediente, HistorialTasaCambio } = models;
  const recetaIngs = await RecetaIngrediente.findAll({
    where: { id_receta: idReceta },
  });

  let costoTotal = 0;
  let monedaUsada = 'USD';

  for (const ri of recetaIngs) {
    const ultimoLote = await LoteIngrediente.findOne({
      where: { id_ingrediente: ri.id_ingrediente },
      order: [['fecha_ingreso', 'DESC']],
    });

    if (ultimoLote && ultimoLote.precio_compra_unitario) {
      costoTotal += parseFloat(ri.cantidad_requerida) * parseFloat(ultimoLote.precio_compra_unitario);
      if (ultimoLote.moneda === 'Bs') monedaUsada = 'Bs';
    }
  }

  const tasaRecord = await HistorialTasaCambio.findOne();
  const tasaActual = tasaRecord ? parseFloat(tasaRecord.valor_bs_por_usd) : 1;
  const costoEnBs = monedaUsada === 'Bs' ? costoTotal : costoTotal * tasaActual;
  const costoEnUsd = monedaUsada === 'USD' ? costoTotal : costoTotal / tasaActual;

  const precioMinimoUsd = costoEnUsd * 1.2;
  const precioSugeridoUsd = costoEnUsd * 1.35;
  const precioMinimoBs = costoEnBs * 1.2;
  const precioSugeridoBs = costoEnBs * 1.35;

  return {
    costoProduccion: {
      USD: Math.ceil(costoEnUsd * 100) / 100,
      Bs: Math.ceil(costoEnBs * 100) / 100,
    },
    precioMinimoRecomendado: {
      USD: Math.ceil(precioMinimoUsd * 100) / 100,
      Bs: Math.ceil(precioMinimoBs * 100) / 100,
    },
    precioSugerido: {
      USD: Math.ceil(precioSugeridoUsd * 100) / 100,
      Bs: Math.ceil(precioSugeridoBs * 100) / 100,
    },
    margenMinimo: '20%',
    tasaCambioUsada: tasaActual,
  };
}

// Optimized implementation for benchmark comparison
async function sugerirPreciosOptimized(idReceta, models) {
  const { RecetaIngrediente, LoteIngrediente, HistorialTasaCambio } = models;
  const recetaIngs = await RecetaIngrediente.findAll({
    where: { id_receta: idReceta },
  });

  let costoTotal = 0;
  let monedaUsada = 'USD';

  if (recetaIngs.length > 0) {
    const ingredientIds = recetaIngs.map((ri) => ri.id_ingrediente);
    const lotes = await LoteIngrediente.findAll({
      where: {
        id_ingrediente: { [Op.in]: ingredientIds },
      },
      order: [['fecha_ingreso', 'DESC']],
    });

    const ultimosLotesMap = new Map();
    for (const lote of lotes) {
      if (!ultimosLotesMap.has(lote.id_ingrediente)) {
        ultimosLotesMap.set(lote.id_ingrediente, lote);
      }
    }

    for (const ri of recetaIngs) {
      const ultimoLote = ultimosLotesMap.get(ri.id_ingrediente);
      if (ultimoLote && ultimoLote.precio_compra_unitario) {
        costoTotal += parseFloat(ri.cantidad_requerida) * parseFloat(ultimoLote.precio_compra_unitario);
        if (ultimoLote.moneda === 'Bs') monedaUsada = 'Bs';
      }
    }
  }

  const tasaRecord = await HistorialTasaCambio.findOne();
  const tasaActual = tasaRecord ? parseFloat(tasaRecord.valor_bs_por_usd) : 1;
  const costoEnBs = monedaUsada === 'Bs' ? costoTotal : costoTotal * tasaActual;
  const costoEnUsd = monedaUsada === 'USD' ? costoTotal : costoTotal / tasaActual;

  const precioMinimoUsd = costoEnUsd * 1.2;
  const precioSugeridoUsd = costoEnUsd * 1.35;
  const precioMinimoBs = costoEnBs * 1.2;
  const precioSugeridoBs = costoEnBs * 1.35;

  return {
    costoProduccion: {
      USD: Math.ceil(costoEnUsd * 100) / 100,
      Bs: Math.ceil(costoEnBs * 100) / 100,
    },
    precioMinimoRecomendado: {
      USD: Math.ceil(precioMinimoUsd * 100) / 100,
      Bs: Math.ceil(precioMinimoBs * 100) / 100,
    },
    precioSugerido: {
      USD: Math.ceil(precioSugeridoUsd * 100) / 100,
      Bs: Math.ceil(precioSugeridoBs * 100) / 100,
    },
    margenMinimo: '20%',
    tasaCambioUsada: tasaActual,
  };
}

async function runBenchmark() {
  console.log('--- RUNNING BENCHMARK (20 ingredients in recipe) ---');

  // Benchmark Original
  const modelsOriginal = createMockModels(2);
  const startOrig = process.hrtime.bigint();
  const resOrig = await sugerirPreciosOriginal(1, modelsOriginal);
  const endOrig = process.hrtime.bigint();
  const timeOrigMs = Number(endOrig - startOrig) / 1e6;
  const queriesOrig = modelsOriginal.getQueryCount();

  // Benchmark Optimized
  const modelsOpt = createMockModels(2);
  const startOpt = process.hrtime.bigint();
  const resOpt = await sugerirPreciosOptimized(1, modelsOpt);
  const endOpt = process.hrtime.bigint();
  const timeOptMs = Number(endOpt - startOpt) / 1e6;
  const queriesOpt = modelsOpt.getQueryCount();

  console.log('\nResults:');
  console.log(`Original  : ${queriesOrig} queries | ${timeOrigMs.toFixed(2)} ms`);
  console.log(`Optimized : ${queriesOpt} queries | ${timeOptMs.toFixed(2)} ms`);
  console.log(`Query Reduction: ${((queriesOrig - queriesOpt) / queriesOrig * 100).toFixed(1)}%`);
  console.log(`Time Speedup   : ${(timeOrigMs / timeOptMs).toFixed(2)}x faster`);

  const resultsMatch = JSON.stringify(resOrig) === JSON.stringify(resOpt);
  console.log(`Functional Equivalence Check: ${resultsMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

  return {
    queriesOrig,
    queriesOpt,
    timeOrigMs,
    timeOptMs,
    resultsMatch,
  };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
