jest.mock('../../../src/models', () => ({
  HistorialTasaCambio: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../src/services/BCVService', () => ({
  obtenerTasasBCV: jest.fn(),
}));

const { HistorialTasaCambio } = require('../../../src/models');
const { obtenerTasasBCV } = require('../../../src/services/BCVService');
const { sincronizarDesdeBCV } = require('../../../src/services/TasaCambioService');

describe('TasaCambioService.sincronizarDesdeBCV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crea una fila nueva con USD y EUR cuando no existe la fecha valor', async () => {
    obtenerTasasBCV.mockResolvedValue({
      usd: 888.1183,
      eur: 989.71903352,
      fechaValor: '2026-10-28',
      fuente: 'BCV',
      respaldo: false,
    });
    HistorialTasaCambio.findOne.mockResolvedValue(null);
    HistorialTasaCambio.create.mockImplementation(async (datos) => ({ id_tasa: 10, ...datos }));

    const resultado = await sincronizarDesdeBCV({ forzar: true });

    expect(HistorialTasaCambio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha_valor: '2026-10-28',
        valor_bs_por_usd: 888.1183,
        valor_bs_por_eur: 989.719,
        fuente_referencia: 'BCV (auto)',
      }),
    );
    expect(resultado.actualizada).toBe(true);
    expect(resultado.fechaValor).toBe('2026-10-28');
  });

  test('actualiza la fila existente de la misma fecha valor', async () => {
    obtenerTasasBCV.mockResolvedValue({
      usd: 890,
      eur: 990,
      fechaValor: '2026-10-28',
      fuente: 'BCV',
      respaldo: false,
    });

    const fila = {
      valor_bs_por_usd: '888.1183',
      valor_bs_por_eur: '989.7190',
      fecha_registro: '2026-10-28',
      save: jest.fn().mockResolvedValue(true),
    };
    HistorialTasaCambio.findOne.mockResolvedValue(fila);

    const resultado = await sincronizarDesdeBCV();

    expect(HistorialTasaCambio.create).not.toHaveBeenCalled();
    expect(fila.valor_bs_por_usd).toBe(890);
    expect(fila.valor_bs_por_eur).toBe(990);
    expect(fila.save).toHaveBeenCalled();
    expect(resultado.actualizada).toBe(true);
  });

  test('no marca cambio si las tasas son idénticas pero registra la sincronización', async () => {
    obtenerTasasBCV.mockResolvedValue({
      usd: 888.1183,
      eur: 989.719,
      fechaValor: '2026-10-28',
      fuente: 'BCV',
      respaldo: false,
    });

    const fila = {
      valor_bs_por_usd: '888.1183',
      valor_bs_por_eur: '989.7190',
      fecha_registro: '2026-10-28',
      save: jest.fn().mockResolvedValue(true),
    };
    HistorialTasaCambio.findOne.mockResolvedValue(fila);

    const resultado = await sincronizarDesdeBCV();

    expect(resultado.actualizada).toBe(false);
    expect(fila.sincronizado_en).toBeInstanceOf(Date);
  });

  test('propaga el error si el BCV no entrega tasa USD', async () => {
    obtenerTasasBCV.mockResolvedValue({ usd: null, eur: 990, fechaValor: null, fuente: 'BCV' });

    await expect(sincronizarDesdeBCV()).rejects.toThrow(/USD/);
  });
});
