const InventarioController = require('../../../src/controllers/InventarioController');
const { LoteIngrediente } = require('../../../src/models');
const sequelize = require('../../../src/config/database');

jest.mock('../../../src/models', () => ({
  Ingrediente: {
    findAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  LoteIngrediente: {
    findAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('../../../src/config/database', () => ({
  transaction: jest.fn(),
}));

jest.mock('../../../src/services/AlertasService', () => ({
  getAlertasVencimiento: jest.fn(),
  getStockBajo: jest.fn(),
}));

describe('InventarioController.ajustarInventario', () => {
  let req;
  let res;
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };

    sequelize.transaction.mockResolvedValue(mockTransaction);

    req = {
      body: {
        id_lote: 1,
        nueva_cantidad: 50,
        motivo: 'Ajuste por merma',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('debe devolver 404 y hacer rollback si el lote no existe', async () => {
    LoteIngrediente.findByPk.mockResolvedValue(null);

    await InventarioController.ajustarInventario(req, res);

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(LoteIngrediente.findByPk).toHaveBeenCalledWith(1, { transaction: mockTransaction });
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Lote no encontrado',
    });
  });

  test('debe ajustar la cantidad exitosamente sin anomalía cuando la diferencia es <= 20%', async () => {
    const mockLote = {
      id: 1,
      cantidad_actual: 100,
      cantidad_inicial: 100,
      save: jest.fn().mockResolvedValue(true),
    };

    LoteIngrediente.findByPk.mockResolvedValue(mockLote);
    req.body.nueva_cantidad = 90; // 10% de diferencia

    await InventarioController.ajustarInventario(req, res);

    expect(mockLote.cantidad_actual).toBe(90);
    expect(mockLote.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        lote: mockLote,
        anomalia: null,
      },
    });
  });

  test('debe ajustar la cantidad exitosamente con anomalía cuando la diferencia es > 20%', async () => {
    const mockLote = {
      id: 1,
      cantidad_actual: 100,
      cantidad_inicial: 100,
      save: jest.fn().mockResolvedValue(true),
    };

    LoteIngrediente.findByPk.mockResolvedValue(mockLote);
    req.body.nueva_cantidad = 50; // 50% de diferencia (> 20%)

    await InventarioController.ajustarInventario(req, res);

    expect(mockLote.cantidad_actual).toBe(50);
    expect(mockLote.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        lote: mockLote,
        anomalia: {
          tipo: 'AJUSTE_SIGNIFICATIVO',
          mensaje: 'Ajuste de 50.00 unidades (50.0% del total)',
        },
      },
    });
  });

  test('debe devolver 500 y hacer rollback si ocurre una excepción inesperada', async () => {
    LoteIngrediente.findByPk.mockRejectedValue(new Error('Database error'));

    await InventarioController.ajustarInventario(req, res);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al ajustar inventario',
    });
  });
});
