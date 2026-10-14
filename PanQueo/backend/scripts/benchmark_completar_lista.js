const { performance } = require('perf_hooks');

// Benchmark script to compare iterative create vs bulkCreate for ComprasController.completarLista logic

async function runBenchmark() {
  const numItems = 100;
  const mockDetalles = [];

  for (let i = 1; i <= numItems; i++) {
    mockDetalles.push({
      id_ingrediente: i,
      cantidad_comprada: '10.50',
      precio_estimado_unitario: '5.00',
    });
  }

  // Latency simulation per database query (e.g. 2ms network/DB roundtrip)
  const DB_LATENCY_MS = 2;
  const simulateQuery = () => new Promise(resolve => setTimeout(resolve, DB_LATENCY_MS));

  // Baseline approach: Iterative LoteIngrediente.create inside loop
  async function completarListaBaseline(detalles) {
    const start = performance.now();
    for (const detalle of detalles) {
      if (parseFloat(detalle.cantidad_comprada) > 0) {
        // Simulate LoteIngrediente.create query
        await simulateQuery();
      }
    }
    const end = performance.now();
    return end - start;
  }

  // Optimized approach: Prepare array and call bulkCreate once
  async function completarListaOptimized(detalles) {
    const start = performance.now();
    const lotesToCreate = [];
    for (const detalle of detalles) {
      if (parseFloat(detalle.cantidad_comprada) > 0) {
        lotesToCreate.push({
          id_ingrediente: detalle.id_ingrediente,
          cantidad_actual: detalle.cantidad_comprada,
          cantidad_inicial: detalle.cantidad_comprada,
          fecha_ingreso: new Date(),
          fecha_venc: new Date(new Date().setMonth(new Date().getMonth() + 6)),
          precio_compra_unitario: detalle.precio_estimado_unitario,
        });
      }
    }

    if (lotesToCreate.length > 0) {
      // Simulate single bulkCreate query
      await simulateQuery();
    }
    const end = performance.now();
    return end - start;
  }

  console.log(`Running benchmark with ${numItems} list items (Simulated DB latency: ${DB_LATENCY_MS}ms/query)...`);

  const baselineTime = await completarListaBaseline(mockDetalles);
  console.log(`Baseline time (iterative create): ${baselineTime.toFixed(2)} ms`);

  const optimizedTime = await completarListaOptimized(mockDetalles);
  console.log(`Optimized time (bulkCreate): ${optimizedTime.toFixed(2)} ms`);

  const speedup = (baselineTime / optimizedTime).toFixed(2);
  const percentImprovement = (((baselineTime - optimizedTime) / baselineTime) * 100).toFixed(2);

  console.log(`Speedup: ${speedup}x faster (${percentImprovement}% reduction in execution time)`);
}

runBenchmark().catch(console.error);
