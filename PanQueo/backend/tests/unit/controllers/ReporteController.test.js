const { Op } = require('sequelize');

// Mock models before requiring controller
jest.mock('../../../src/models', () => {
  return {
    Pedido: {
      findAll: jest.fn(),
    },
    Receta: {},
    RecetaIngrediente: {},
    Ingrediente: {},
    LoteIngrediente: {
      findAll: jest.fn(),
    },
  };
});

const { Pedido, LoteIngrediente } = require('../../../src/models');
const ReporteController = require('../../../src/controllers/ReporteController');

describe('ReporteController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('produccion', () => {
    test('should return production report without date filter', async () => {
      const mockPedidos = [
        { id: 1, estado_entrega: 'Listo', Receta: { nombre_receta: 'Pan Canilla' } },
        { id: 2, estado_entrega: 'En Cocina', Receta: { nombre_receta: 'Pan Canilla' } },
        { id: 3, estado_entrega: 'Entregado', Receta: { nombre_receta: 'Cachito' } },
        { id: 4, estado_entrega: 'Listo', Receta: null },
      ];

      Pedido.findAll.mockResolvedValue(mockPedidos);

      await ReporteController.produccion(req, res);

      expect(Pedido.findAll).toHaveBeenCalledTimes(1);
      expect(Pedido.findAll).toHaveBeenCalledWith({
        where: {
          estado_entrega: { [Op.in]: ['Entregado', 'Listo', 'En Cocina'] },
        },
        include: expect.any(Array),
        order: [['fecha_entrega', 'ASC']],
      });

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          totalProducido: 4,
          producidosPorReceta: {
            'Pan Canilla': 2,
            'Cachito': 1,
            'Sin receta': 1,
          },
          pedidos: mockPedidos,
        },
      });
    });

    test('should apply fecha_inicio and fecha_fin filters when provided', async () => {
      req.query = {
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-01-31',
      };

      Pedido.findAll.mockResolvedValue([]);

      await ReporteController.produccion(req, res);

      expect(Pedido.findAll).toHaveBeenCalledTimes(1);
      expect(Pedido.findAll).toHaveBeenCalledWith({
        where: {
          fecha_entrega: { [Op.between]: ['2026-01-01', '2026-01-31'] },
          estado_entrega: { [Op.in]: ['Entregado', 'Listo', 'En Cocina'] },
        },
        include: expect.any(Array),
        order: [['fecha_entrega', 'ASC']],
      });

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          totalProducido: 0,
          producidosPorReceta: {},
          pedidos: [],
        },
      });
    });

    test('should handle empty result set correctly', async () => {
      Pedido.findAll.mockResolvedValue([]);

      await ReporteController.produccion(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          totalProducido: 0,
          producidosPorReceta: {},
          pedidos: [],
        },
      });
    });

    test('should return status 500 when database throws an error', async () => {
      Pedido.findAll.mockRejectedValue(new Error('Database error'));

      await ReporteController.produccion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al generar reporte de producción',
      });
    });
  });

  describe('mermas', () => {
    test('should generate mermas report correctly', async () => {
      const mockLotesVencidos = [
        {
          id: 1,
          cantidad_actual: '5.5',
          precio_compra_unitario: '2.00',
          Ingrediente: { nombre: 'Harina' },
        },
        {
          id: 2,
          cantidad_actual: '10.0',
          precio_compra_unitario: null,
          Ingrediente: { nombre: 'Levadura' },
        },
      ];

      LoteIngrediente.findAll.mockResolvedValue(mockLotesVencidos);

      await ReporteController.mermas(req, res);

      expect(LoteIngrediente.findAll).toHaveBeenCalledTimes(1);
      expect(LoteIngrediente.findAll).toHaveBeenCalledWith({
        where: {
          fecha_venc: { [Op.lt]: expect.any(Date) },
          cantidad_actual: { [Op.gt]: 0 },
        },
        include: expect.any(Array),
        order: [['fecha_venc', 'DESC']],
      });

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          totalLotesVencidos: 2,
          mermaTotal: 15.5,
          mermaValorEstimado: 11,
          lotes: mockLotesVencidos,
        },
      });
    });

    test('should return status 500 when mermas encounters a database error', async () => {
      LoteIngrediente.findAll.mockRejectedValue(new Error('Database error'));

      await ReporteController.mermas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al generar reporte de mermas',
      });
    });
  });

  describe('balancePedidos', () => {
    test('should generate balance report correctly', async () => {
      const mockPedidos = [
        { costo_total: '100.00', monto_abonado: '50.00', estado_pago: 'Abonado' },
        { costo_total: '200.00', monto_abonado: '200.00', estado_pago: 'Pagado' },
        { costo_total: '150.00', monto_abonado: '0.00', estado_pago: 'Pendiente' },
      ];

      Pedido.findAll.mockResolvedValue(mockPedidos);

      await ReporteController.balancePedidos(req, res);

      expect(Pedido.findAll).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          totalVentas: 450,
          totalAbonado: 250,
          balancePendiente: 200,
          totalPedidos: 3,
          pendientes: 1,
          abonados: 1,
          pagados: 1,
        },
      });
    });

    test('should return status 500 when balancePedidos encounters an error', async () => {
      Pedido.findAll.mockRejectedValue(new Error('Database error'));

      await ReporteController.balancePedidos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al generar reporte de balances',
      });
    });
  });
});
