const FinanzasController = require('../../../src/controllers/FinanzasController');
const { HistorialTasaCambio } = require('../../../src/models');
const { sincronizarDesdeBCV } = require('../../../src/services/TasaCambioService');

jest.mock('../../../src/models', () => ({
  HistorialTasaCambio: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../../src/services/TasaCambioService', () => ({
  sincronizarDesdeBCV: jest.fn(),
}));

const ORDEN_VIGENTE = [
  ['fecha_registro', 'DESC'],
  ['id_tasa', 'DESC'],
];

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

  test('devuelve USD y EUR de la tasa vigente ya normalizados', async () => {
    HistorialTasaCambio.findOne.mockResolvedValue({
      id_tasa: 7,
      valor_bs_por_usd: '888.1183',
      valor_bs_por_eur: '989.7190',
      fecha_registro: '2026-10-28',
      fecha_valor: '2026-10-28',
      fuente_referencia: 'BCV (auto)',
      sincronizado_en: new Date('2026-10-28T12:00:00Z'),
      updatedAt: new Date('2026-10-28T12:00:00Z'),
    });

    await FinanzasController.tasaActual(req, res);

    expect(HistorialTasaCambio.findOne).toHaveBeenCalledWith({ order: ORDEN_VIGENTE });
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: expect.objectContaining({
        valor_bs_por_usd: 888.1183,
        valor_bs_por_eur: 989.719,
        fecha_valor: '2026-10-28',
        automatico: true,
      }),
    });
  });

  test('devuelve objeto por defecto cuando no hay ninguna tasa registrada', async () => {
    HistorialTasaCambio.findOne.mockResolvedValue(null);

    await FinanzasController.tasaActual(req, res);

    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { valor_bs_por_usd: null, valor_bs_por_eur: null, mensaje: 'No hay tasa registrada' },
    });
  });

  test('devuelve 500 cuando falla la consulta', async () => {
    HistorialTasaCambio.findOne.mockRejectedValue(new Error('Database error'));

    await FinanzasController.tasaActual(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al obtener tasa actual',
    });
  });
});

describe('FinanzasController - registrarTasa (manual)', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('registra USD y EUR manualmente y marca la fuente', async () => {
    req.body = { valor_bs_por_usd: 888.5, valor_bs_por_eur: 990.25, fuente_referencia: 'Manual' };
    HistorialTasaCambio.create.mockImplementation(async (datos) => ({ id_tasa: 2, ...datos }));

    await FinanzasController.registrarTasa(req, res);

    expect(HistorialTasaCambio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        valor_bs_por_usd: 888.5,
        valor_bs_por_eur: 990.25,
        fuente_referencia: 'Manual',
        sincronizado_en: null,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: expect.objectContaining({ valor_bs_por_usd: 888.5, valor_bs_por_eur: 990.25, automatico: false }),
    });
  });

  test('usa "Manual" por defecto si no se envía fuente', async () => {
    req.body = { valor_bs_por_usd: 890 };
    HistorialTasaCambio.create.mockImplementation(async (datos) => ({ id_tasa: 3, ...datos }));

    await FinanzasController.registrarTasa(req, res);

    expect(HistorialTasaCambio.create).toHaveBeenCalledWith(
      expect.objectContaining({ fuente_referencia: 'Manual' }),
    );
  });

  test('rechaza una tasa USD inválida', async () => {
    req.body = { valor_bs_por_usd: 0 };

    await FinanzasController.registrarTasa(req, res);

    expect(HistorialTasaCambio.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rechaza una tasa EUR inválida', async () => {
    req.body = { valor_bs_por_usd: 890, valor_bs_por_eur: -5 };

    await FinanzasController.registrarTasa(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'La tasa EUR debe ser un número mayor a 0',
    });
  });

  test('devuelve 500 cuando falla el registro', async () => {
    req.body = { valor_bs_por_usd: 890 };
    HistorialTasaCambio.create.mockRejectedValue(new Error('Insert error'));

    await FinanzasController.registrarTasa(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al registrar tasa',
    });
  });
});

describe('FinanzasController - sincronizarTasa (automático BCV)', () => {
  let res;

  beforeEach(() => {
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('sincroniza contra el BCV y devuelve las tasas guardadas', async () => {
    sincronizarDesdeBCV.mockResolvedValue({
      tasa: {
        id_tasa: 9,
        valor_bs_por_usd: '888.1183',
        valor_bs_por_eur: '989.7190',
        fecha_registro: '2026-10-28',
        fecha_valor: '2026-10-28',
        fuente_referencia: 'BCV (auto)',
        sincronizado_en: new Date(),
        updatedAt: new Date(),
      },
      actualizada: true,
      fuente: 'BCV',
      fechaValor: '2026-10-28',
      respaldo: false,
    });

    await FinanzasController.sincronizarTasa({ body: {} }, res);

    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: expect.objectContaining({ valor_bs_por_usd: 888.1183, valor_bs_por_eur: 989.719 }),
      meta: expect.objectContaining({ actualizada: true, fuente: 'BCV', fechaValor: '2026-10-28' }),
    });
  });

  test('devuelve 502 si el BCV no se puede consultar', async () => {
    sincronizarDesdeBCV.mockRejectedValue(new Error('Tiempo de espera agotado consultando el BCV'));

    await FinanzasController.sincronizarTasa({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Tiempo de espera agotado consultando el BCV',
    });
  });
});

describe('FinanzasController - historialTasas', () => {
  let res;

  beforeEach(() => {
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('devuelve el historial ordenado con límite de 30 y con la tasa EUR', async () => {
    HistorialTasaCambio.findAll.mockResolvedValue([
      { id_tasa: 2, valor_bs_por_usd: '890.0000', valor_bs_por_eur: '995.0000', fuente_referencia: 'BCV (auto)' },
      { id_tasa: 1, valor_bs_por_usd: '888.1183', valor_bs_por_eur: null, fuente_referencia: 'BCV' },
    ]);

    await FinanzasController.historialTasas({}, res);

    expect(HistorialTasaCambio.findAll).toHaveBeenCalledWith({ order: ORDEN_VIGENTE, limit: 30 });
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: [
        expect.objectContaining({ valor_bs_por_usd: 890, valor_bs_por_eur: 995 }),
        expect.objectContaining({ valor_bs_por_usd: 888.1183, valor_bs_por_eur: null }),
      ],
    });
  });

  test('devuelve 500 cuando falla la consulta del historial', async () => {
    HistorialTasaCambio.findAll.mockRejectedValue(new Error('Query error'));

    await FinanzasController.historialTasas({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al obtener historial de tasas',
    });
  });
});
