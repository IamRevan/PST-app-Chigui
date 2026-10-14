const { RecetaIngrediente, LoteIngrediente } = require('../src/models');
const FIFOService = require('../src/services/FIFOService');

async function testEdgeCases() {
  console.log('--- Testing Edge Cases ---');

  const originalFindAllReceta = RecetaIngrediente.findAll;
  const originalFindAllLote = LoteIngrediente.findAll;

  try {
    // 1. Empty recipe ingredients
    RecetaIngrediente.findAll = async () => [];
    let result = await FIFOService.verificarStockSuficiente(99);
    if (!result.suficiente || result.detalles.length !== 0) {
      throw new Error('Failed edge case: empty recipe ingredients');
    }
    console.log('✅ Edge Case 1 Passed: Empty recipe ingredients');

    // 2. Ingredients with no matching lotes
    RecetaIngrediente.findAll = async () => [
      { id_ingrediente: 101, cantidad_requerida: '10', Ingrediente: { nombre_ing: 'Harina' } },
      { id_ingrediente: 102, cantidad_requerida: '5', Ingrediente: { nombre_ing: 'Azúcar' } },
    ];
    LoteIngrediente.findAll = async () => [
      { id_ingrediente: 101, total_stock: '15' } // 102 has no lote
    ];

    result = await FIFOService.verificarStockSuficiente(1);
    if (result.suficiente !== false || result.detalles.length !== 2) {
      throw new Error('Failed edge case 2: partial missing lotes return structure');
    }
    if (result.detalles[1].disponible !== 0 || result.detalles[1].suficiente !== false) {
      throw new Error('Failed edge case 2: missing lote stock handling');
    }
    console.log('✅ Edge Case 2 Passed: Ingredients with missing lotes');

  } finally {
    RecetaIngrediente.findAll = originalFindAllReceta;
    LoteIngrediente.findAll = originalFindAllLote;
  }
}

testEdgeCases().catch(err => {
  console.error('Edge case test failed:', err);
  process.exit(1);
});
