const FinanzasController = require('../../../src/controllers/FinanzasController');
const { HistorialTasaCambio } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  HistorialTasaCambio: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('FinanzasController - tasaActual', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('debe retornar la tasa de cambio actual cuando existe en la base de datos y verificar los parámetros de ordenamiento', async () => {
    const mockTasa = {
      id: 1,
      valor_bs_por_usd: 36.5,
      fuente_referencia: 'BCV',
      fecha_registro: '2026-07-11T00:00:00.000Z',
    };

    HistorialTasaCambio.findOne.mockResolvedValue(mockTasa);

    await FinanzasController.tasaActual(req, res);

    expect(HistorialTasaCambio.findOne).toHaveBeenCalledTimes(1);
    expect(HistorialTasaCambio.findOne).toHaveBeenCalledWith({
      order: [['fecha_registro', 'DESC']],
    });
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockTasa,
    });
  });

  test('debe retornar objeto por defecto cuando no hay ninguna tasa registrada (null)', async () => {
    HistorialTasaCambio.findOne.mockResolvedValue(null);

    await FinanzasController.tasaActual(req, res);

    expect(HistorialTasaCambio.findOne).toHaveBeenCalledTimes(1);
    expect(HistorialTasaCambio.findOne).toHaveBeenCalledWith({
      order: [['fecha_registro', 'DESC']],
    });
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { valor_bs_por_usd: null, mensaje: 'No hay tasa registrada' },
    });
  });

  test('debe retornar estado HTTP 500 cuando ocurre un error en la base de datos', async () => {
    const errorSimulado = new Error('Database error');
    HistorialTasaCambio.findOne.mockRejectedValue(errorSimulado);

    await FinanzasController.tasaActual(req, res);

    expect(HistorialTasaCambio.findOne).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al obtener tasa actual',
    });
  });
});

describe('FinanzasController - registrarTasa', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('debe registrar una nueva tasa exitosamente usando valor y fuente provistos', async () => {
    req.body = {
      valor_bs_por_usd: 37.2,
      fuente_referencia: 'Paralelo',
    };

    const mockTasaCreada = {
      id: 2,
      valor_bs_por_usd: 37.2,
      fuente_referencia: 'Paralelo',
      fecha_registro: new Date(),
    };

    HistorialTasaCambio.create.mockResolvedValue(mockTasaCreada);

    await FinanzasController.registrarTasa(req, res);

    expect(HistorialTasaCambio.create).toHaveBeenCalledTimes(1);
    expect(HistorialTasaCambio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        valor_bs_por_usd: 37.2,
        fuente_referencia: 'Paralelo',
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockTasaCreada,
    });
  });

  test('debe usar "BCV" por defecto si fuente_referencia no es proporcionada', async () => {
    req.body = {
      valor_bs_por_usd: 37.0,
    };

    const mockTasaCreada = {
      id: 3,
      valor_bs_por_usd: 37.0,
      fuente_referencia: 'BCV',
      fecha_registro: new Date(),
    };

    HistorialTasaCambio.create.mockResolvedValue(mockTasaCreada);

    await FinanzasController.registrarTasa(req, res);

    expect(HistorialTasaCambio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        valor_bs_por_usd: 37.0,
        fuente_referencia: 'BCV',
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('debe retornar estado 500 cuando ocurre un error al registrar la tasa', async () => {
    req.body = { valor_bs_por_usd: 37.0 };
    HistorialTasaCambio.create.mockRejectedValue(new Error('Insert error'));

    await FinanzasController.registrarTasa(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al registrar tasa',
    });
  });
});

describe('FinanzasController - historialTasas', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('debe retornar el historial de tasas ordenado descendentemente con limite de 30', async () => {
    const mockTasas = [
      { id: 2, valor_bs_por_usd: 37.2 },
      { id: 1, valor_bs_por_usd: 36.5 },
    ];

    HistorialTasaCambio.findAll.mockResolvedValue(mockTasas);

    await FinanzasController.historialTasas(req, res);

    expect(HistorialTasaCambio.findAll).toHaveBeenCalledWith({
      order: [['fecha_registro', 'DESC']],
      limit: 30,
    });
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockTasas,
    });
  });

  test('debe retornar estado 500 cuando ocurre un error al consultar el historial', async () => {
    HistorialTasaCambio.findAll.mockRejectedValue(new Error('Query error'));

    await FinanzasController.historialTasas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al obtener historial de tasas',
    });
  });
});
