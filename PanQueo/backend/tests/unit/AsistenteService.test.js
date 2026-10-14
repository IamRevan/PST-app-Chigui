const { Op } = require('sequelize');

jest.mock('../../src/models', () => {
  return {
    RecetaIngrediente: {
      findAll: jest.fn(),
    },
    Ingrediente: {
      findAll: jest.fn(),
    },
    LoteIngrediente: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      sum: jest.fn(),
    },
    Pedido: {
      count: jest.fn(),
    },
    HistorialTasaCambio: {
      findOne: jest.fn(),
    },
  };
});

const models = require('../../src/models');
const AsistenteService = require('../../src/services/AsistenteService');

describe('AsistenteService.sugerirPrecios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles empty recipe ingredients without querying LoteIngrediente', async () => {
    models.RecetaIngrediente.findAll.mockResolvedValue([]);
    models.HistorialTasaCambio.findOne.mockResolvedValue({ valor_bs_por_usd: '36.5' });

    const result = await AsistenteService.sugerirPrecios(1);

    expect(models.RecetaIngrediente.findAll).toHaveBeenCalledWith({
      where: { id_receta: 1 },
      include: [{ model: models.Ingrediente }],
    });
    expect(models.LoteIngrediente.findAll).not.toHaveBeenCalled();
    expect(result.costoProduccion).toEqual({ USD: 0, Bs: 0 });
    expect(result.precioMinimoRecomendado).toEqual({ USD: 0, Bs: 0 });
    expect(result.precioSugerido).toEqual({ USD: 0, Bs: 0 });
    expect(result.tasaCambioUsada).toBe(36.5);
  });

  test('fetches lotes in a single query with Op.in and orders by fecha_ingreso DESC', async () => {
    const mockRecetaIngs = [
      { id_receta: 1, id_ingrediente: 10, cantidad_requerida: '2' },
      { id_receta: 1, id_ingrediente: 20, cantidad_requerida: '3' },
    ];

    const mockLotes = [
      { id_lote: 1, id_ingrediente: 10, precio_compra_unitario: '5.00', moneda: 'USD', fecha_ingreso: '2023-05-01' },
      { id_lote: 2, id_ingrediente: 10, precio_compra_unitario: '4.00', moneda: 'USD', fecha_ingreso: '2023-01-01' },
      { id_lote: 3, id_ingrediente: 20, precio_compra_unitario: '10.00', moneda: 'Bs', fecha_ingreso: '2023-06-01' },
    ];

    models.RecetaIngrediente.findAll.mockResolvedValue(mockRecetaIngs);
    models.LoteIngrediente.findAll.mockResolvedValue(mockLotes);
    models.HistorialTasaCambio.findOne.mockResolvedValue({ valor_bs_por_usd: '36.0' });

    const result = await AsistenteService.sugerirPrecios(1);

    expect(models.LoteIngrediente.findAll).toHaveBeenCalledTimes(1);
    expect(models.LoteIngrediente.findAll).toHaveBeenCalledWith({
      where: {
        id_ingrediente: { [Op.in]: [10, 20] },
      },
      order: [['fecha_ingreso', 'DESC']],
    });

    // Cost calculation:
    // Ing 10: 2 * 5.00 = 10.00 USD
    // Ing 20: 3 * 10.00 = 30.00 Bs
    // Total costo = 40.00 in Bs currency mode (since ing 20 uses Bs, monedaUsada becomes 'Bs')
    // costoEnBs = 40, costoEnUsd = 40 / 36 = 1.111... -> 1.12 ceil
    expect(result.costoProduccion.Bs).toBe(40);
    expect(result.costoProduccion.USD).toBe(1.12);
  });

  test('handles missing lotes for an ingredient gracefully', async () => {
    const mockRecetaIngs = [
      { id_receta: 1, id_ingrediente: 10, cantidad_requerida: '2' },
      { id_receta: 1, id_ingrediente: 99, cantidad_requerida: '5' }, // No lotes for ing 99
    ];

    const mockLotes = [
      { id_lote: 1, id_ingrediente: 10, precio_compra_unitario: '5.00', moneda: 'USD', fecha_ingreso: '2023-05-01' },
    ];

    models.RecetaIngrediente.findAll.mockResolvedValue(mockRecetaIngs);
    models.LoteIngrediente.findAll.mockResolvedValue(mockLotes);
    models.HistorialTasaCambio.findOne.mockResolvedValue({ valor_bs_por_usd: '36.0' });

    const result = await AsistenteService.sugerirPrecios(1);

    expect(models.LoteIngrediente.findAll).toHaveBeenCalledTimes(1);
    // Costo total = 2 * 5.00 = 10 USD
    expect(result.costoProduccion.USD).toBe(10);
    expect(result.costoProduccion.Bs).toBe(360);
  });
});
