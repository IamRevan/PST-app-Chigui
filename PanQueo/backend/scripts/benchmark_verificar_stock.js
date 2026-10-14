const { RecetaIngrediente, LoteIngrediente } = require('../src/models');
const FIFOService = require('../src/services/FIFOService');

// Benchmark and functional verification script for FIFOService.verificarStockSuficiente

async function runBenchmark() {
  console.log('--- Benchmarking FIFOService.verificarStockSuficiente ---');

  // Create mock dataset: 20 ingredients in a recipe
  const mockIngredients = Array.from({ length: 20 }, (_, i) => ({
    id_ingrediente: i + 1,
    cantidad_requerida: (i + 1) * 2.5,
    Ingrediente: { nombre_ing: `Ingrediente ${i + 1}` },
  }));

  // Store original methods
  const originalFindAllReceta = RecetaIngrediente.findAll;
  const originalSumLote = LoteIngrediente.sum;
  const originalFindAllLote = LoteIngrediente.findAll;

  let queryCount = 0;

  try {
    // Stub RecetaIngrediente.findAll
    RecetaIngrediente.findAll = async () => {
      queryCount++;
      return mockIngredients;
    };

    // Stub LoteIngrediente.sum (for original behavior reference if needed)
    LoteIngrediente.sum = async (field, options) => {
      queryCount++;
      const id = options.where.id_ingrediente;
      return String(id * 5.0); // aggregate SUM as string
    };

    // Stub LoteIngrediente.findAll (for optimized implementation)
    LoteIngrediente.findAll = async (options) => {
      queryCount++;
      const ids = options.where?.id_ingrediente?.[Object.getOwnPropertySymbols(options.where.id_ingrediente)[0]] || [];
      // Simulate aggregated sum results
      return mockIngredients
        .filter(i => !ids.length || ids.includes(i.id_ingrediente))
        .map(i => ({
          id_ingrediente: i.id_ingrediente,
          total_stock: String(i.id_ingrediente * 5.0),
        }));
    };

    // Run verification call
    queryCount = 0;
    const startTime = process.hrtime.bigint();
    const iterations = 1000;

    let result;
    for (let i = 0; i < iterations; i++) {
      result = await FIFOService.verificarStockSuficiente(1);
    }
    const endTime = process.hrtime.bigint();
    const totalMs = Number(endTime - startTime) / 1e6;

    console.log(`Executed ${iterations} iterations.`);
    console.log(`Queries per call: ${queryCount / iterations}`);
    console.log(`Total time for ${iterations} calls: ${totalMs.toFixed(2)} ms`);
    console.log(`Average time per call: ${(totalMs / iterations).toFixed(4)} ms`);
    console.log('\nSample Output Structure:');
    console.log(JSON.stringify(result, null, 2));

    // Validations
    if (!result || typeof result.suficiente !== 'boolean' || !Array.isArray(result.detalles)) {
      throw new Error('Result format invalid!');
    }
    if (result.detalles.length !== mockIngredients.length) {
      throw new Error(`Expected ${mockIngredients.length} details, got ${result.detalles.length}`);
    }

    console.log('\n✅ Verification & Benchmark complete.');

  } finally {
    // Restore original methods
    RecetaIngrediente.findAll = originalFindAllReceta;
    LoteIngrediente.sum = originalSumLote;
    LoteIngrediente.findAll = originalFindAllLote;
  }
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}

module.exports = { runBenchmark };
