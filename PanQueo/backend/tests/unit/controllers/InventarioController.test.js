const InventarioController = require('../../../src/controllers/InventarioController');
const { LoteIngrediente } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  LoteIngrediente: {
    create: jest.fn(),
  },
  Ingrediente: {
    findAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

describe('InventarioController - crearLote', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('crearLote', () => {
    test('debe retornar 400 si la fecha de vencimiento es anterior a la fecha de ingreso', async () => {
      req.body = {
        id_ingrediente: 1,
        cantidad_actual: 50,
        fecha_ingreso: '2023-05-10',
        fecha_venc: '2023-05-01',
      };

      await InventarioController.crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'La fecha de vencimiento debe ser posterior a la fecha de ingreso',
      });
      expect(LoteIngrediente.create).not.toHaveBeenCalled();
    });

    test('debe retornar 201 y crear el lote si la fecha de vencimiento es posterior a la fecha de ingreso', async () => {
      const mockLote = {
        id: 1,
        id_ingrediente: 1,
        cantidad_actual: 50,
        cantidad_inicial: 50,
        fecha_ingreso: '2023-05-01',
        fecha_venc: '2023-05-10',
      };

      req.body = {
        id_ingrediente: 1,
        cantidad_actual: 50,
        fecha_ingreso: '2023-05-01',
        fecha_venc: '2023-05-10',
      };

      LoteIngrediente.create.mockResolvedValue(mockLote);

      await InventarioController.crearLote(req, res);

      expect(LoteIngrediente.create).toHaveBeenCalledWith({
        ...req.body,
        cantidad_inicial: 50,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLote,
      });
    });

    test('debe retornar 201 si la fecha de vencimiento es igual a la fecha de ingreso', async () => {
      const mockLote = {
        id: 2,
        id_ingrediente: 1,
        cantidad_actual: 30,
        cantidad_inicial: 30,
        fecha_ingreso: '2023-05-10',
        fecha_venc: '2023-05-10',
      };

      req.body = {
        id_ingrediente: 1,
        cantidad_actual: 30,
        fecha_ingreso: '2023-05-10',
        fecha_venc: '2023-05-10',
      };

      LoteIngrediente.create.mockResolvedValue(mockLote);

      await InventarioController.crearLote(req, res);

      expect(LoteIngrediente.create).toHaveBeenCalledWith({
        ...req.body,
        cantidad_inicial: 30,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockLote,
      });
    });

    test('debe retornar 500 si ocurre un error de base de datos al crear el lote', async () => {
      req.body = {
        id_ingrediente: 1,
        cantidad_actual: 50,
        fecha_ingreso: '2023-05-01',
        fecha_venc: '2023-05-10',
      };

      LoteIngrediente.create.mockRejectedValue(new Error('Database connection failed'));

      await InventarioController.crearLote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al crear lote',
      });
    });
  });
});
