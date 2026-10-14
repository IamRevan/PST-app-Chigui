const AsistenteService = require('../../../src/services/AsistenteService');
const { Ingrediente, LoteIngrediente, RecetaIngrediente, Pedido } = require('../../../src/models');

jest.mock('../../../src/models', () => {
  return {
    Ingrediente: {
      findAll: jest.fn(),
    },
    LoteIngrediente: {
      sum: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    RecetaIngrediente: {
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
    Pedido: {
      count: jest.fn(),
    },
    HistorialTasaCambio: {
      findOne: jest.fn(),
    },
    sequelize: {
      fn: (fnName, col) => `${fnName}(${col})`,
      col: (colName) => colName,
    },
    Op: {
      in: Symbol('in'),
    },
  };
});

describe('AsistenteService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calcularConsumoPromedioDiario', () => {
    it('should calculate daily average consumption correctly for single ingredient', async () => {
      RecetaIngrediente.findOne.mockResolvedValue({ total_consumido: '50' });
      Pedido.count.mockResolvedValue(10);

      const result = await AsistenteService.calcularConsumoPromedioDiario(1);

      expect(result).toBe(5);
      expect(RecetaIngrediente.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_ingrediente: 1 },
        })
      );
      expect(Pedido.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado_entrega: expect.anything(),
          }),
        })
      );
    });

    it('should return 0 if recetasUsadas is 0', async () => {
      RecetaIngrediente.findOne.mockResolvedValue({ total_consumido: '50' });
      Pedido.count.mockResolvedValue(0);

      const result = await AsistenteService.calcularConsumoPromedioDiario(1);

      expect(result).toBe(0);
    });
  });

  describe('predecirCompra', () => {
    it('should return predictions with constant queries using batch aggregations', async () => {
      Ingrediente.findAll.mockResolvedValue([
        { id_ingrediente: 1, nombre_ing: 'Harina', stock_minimo: '10.00' },
        { id_ingrediente: 2, nombre_ing: 'Azúcar', stock_minimo: '5.00' },
      ]);

      Pedido.count.mockResolvedValue(5);

      LoteIngrediente.findAll.mockResolvedValue([
        { id_ingrediente: 1, stockActual: '5.00' },
        { id_ingrediente: 2, stockActual: '20.00' },
      ]);

      RecetaIngrediente.findAll.mockResolvedValue([
        { id_ingrediente: 1, totalConsumido: '35.00' }, // avg = 7/day -> 7 days = 49 suggested -> sugerido = 49 - 5 = 44
        { id_ingrediente: 2, totalConsumido: '0.00' },  // avg = 0 -> sugerido = 0, stock 20 > stockMinimo 5 -> no prediction
      ]);

      const result = await AsistenteService.predecirCompra();

      expect(Ingrediente.findAll).toHaveBeenCalledTimes(1);
      expect(Pedido.count).toHaveBeenCalledTimes(1);
      expect(LoteIngrediente.findAll).toHaveBeenCalledTimes(1);
      expect(RecetaIngrediente.findAll).toHaveBeenCalledTimes(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ingrediente: 'Harina',
        stockActual: 5,
        stockMinimo: 10,
        consumoPromedioDiario: 7,
        sugeridoComprar: 44,
        critico: true,
      });
      expect(typeof result[0].stockActual).toBe('number');
      expect(typeof result[0].stockMinimo).toBe('number');
      expect(typeof result[0].consumoPromedioDiario).toBe('number');
      expect(typeof result[0].sugeridoComprar).toBe('number');
    });

    it('should return empty array if no ingredients found', async () => {
      Ingrediente.findAll.mockResolvedValue([]);

      const result = await AsistenteService.predecirCompra();

      expect(result).toEqual([]);
      expect(Pedido.count).not.toHaveBeenCalled();
    });
  });
});
