const ClienteController = require('../../../src/controllers/ClienteController');
const { Cliente, Pedido } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Cliente: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Pedido: {
    findAll: jest.fn(),
  },
}));

describe('ClienteController', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };
    next = jest.fn();
  });

  describe('listar', () => {
    it('should return list of clientes successfully', async () => {
      Cliente.findAndCountAll.mockResolvedValue({
        rows: [{ id_cliente: 1, nombre: 'Juan' }],
        count: 1,
      });

      await ClienteController.listar(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          clientes: [{ id_cliente: 1, nombre: 'Juan' }],
          total: 1,
          pagina: 1,
          totalPaginas: 1,
        },
      });
    });

    it('should handle error when findAndCountAll fails', async () => {
      Cliente.findAndCountAll.mockRejectedValue(new Error('DB Error'));

      await ClienteController.listar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al listar clientes',
      });
    });
  });

  describe('obtener', () => {
    it('should return cliente if found', async () => {
      req.params.id = 1;
      const clienteMock = { id_cliente: 1, nombre: 'Juan' };
      Cliente.findByPk.mockResolvedValue(clienteMock);

      await ClienteController.obtener(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: clienteMock,
      });
    });

    it('should return 404 if cliente not found', async () => {
      req.params.id = 999;
      Cliente.findByPk.mockResolvedValue(null);

      await ClienteController.obtener(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Cliente no encontrado',
      });
    });

    it('should handle error when findByPk fails', async () => {
      req.params.id = 1;
      Cliente.findByPk.mockRejectedValue(new Error('DB Error'));

      await ClienteController.obtener(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al obtener cliente',
      });
    });
  });

  describe('crear', () => {
    it('should create a new client when cedula is unique', async () => {
      req.body = { nombre: 'Maria', apellido: 'Perez', cedula: '12345' };
      Cliente.findOne.mockResolvedValue(null);
      Cliente.create.mockResolvedValue({ id_cliente: 2, ...req.body });

      await ClienteController.crear(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { id_cliente: 2, nombre: 'Maria', apellido: 'Perez', cedula: '12345' },
      });
    });

    it('should return 400 when cedula already exists', async () => {
      req.body = { cedula: '12345' };
      Cliente.findOne.mockResolvedValue({ id_cliente: 1, cedula: '12345' });

      await ClienteController.crear(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'La cédula ya está registrada',
      });
    });

    it('should handle error when create fails', async () => {
      req.body = { cedula: '12345' };
      Cliente.findOne.mockRejectedValue(new Error('DB Error'));

      await ClienteController.crear(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al crear cliente',
      });
    });
  });

  describe('actualizar', () => {
    it('should update client when found', async () => {
      req.params.id = 1;
      req.body = { nombre: 'Juan Updated' };
      const clienteMock = {
        id_cliente: 1,
        nombre: 'Juan',
        update: jest.fn().mockResolvedValue(true),
      };
      Cliente.findByPk.mockResolvedValue(clienteMock);

      await ClienteController.actualizar(req, res, next);

      expect(clienteMock.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: clienteMock,
      });
    });

    it('should return 404 when client to update is not found', async () => {
      req.params.id = 999;
      Cliente.findByPk.mockResolvedValue(null);

      await ClienteController.actualizar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Cliente no encontrado',
      });
    });

    it('should handle error when update fails', async () => {
      req.params.id = 1;
      Cliente.findByPk.mockRejectedValue(new Error('DB Error'));

      await ClienteController.actualizar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al actualizar cliente',
      });
    });
  });

  describe('historial', () => {
    it('should return purchase history for client', async () => {
      req.params.id = 1;
      const pedidosMock = [{ id_pedido: 10, total: 100 }];
      Pedido.findAll.mockResolvedValue(pedidosMock);

      await ClienteController.historial(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: pedidosMock,
      });
    });

    it('should handle error when findAll fails', async () => {
      req.params.id = 1;
      Pedido.findAll.mockRejectedValue(new Error('DB Error'));

      await ClienteController.historial(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al obtener historial',
      });
    });
  });
});
