jest.mock('../../../src/models', () => ({
  Usuario: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../../src/services/AuditService', () => ({
  registrarEvento: jest.fn().mockResolvedValue(undefined),
}));

const { Usuario } = require('../../../src/models');
const { registrarEvento } = require('../../../src/services/AuditService');
const AdminController = require('../../../src/controllers/AdminController');

const crearUsuario = (extra = {}) => ({
  id_usuario: 3,
  nombre: 'Ana',
  apellido: 'Pérez',
  email: 'ana@example.com',
  telefono: '123',
  rol: 'vendedor',
  activo: true,
  email_verificado_at: new Date(),
  mfa_enabled: false,
  created_at: new Date(),
  update: jest.fn().mockImplementation(function actualizar(cambios) {
    Object.assign(this, cambios);
    return Promise.resolve(this);
  }),
  ...extra,
});

describe('AdminController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      usuario: { id_usuario: 1, rol: 'admin' },
      params: {},
      body: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('listarUsuarios', () => {
    test('devuelve la lista serializada', async () => {
      Usuario.findAll.mockResolvedValue([crearUsuario()]);

      await AdminController.listarUsuarios(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: [expect.objectContaining({ id: 3, rol: 'vendedor', activo: true })],
      });
    });
  });

  describe('cambiarRol', () => {
    test('asigna el rol y registra el evento', async () => {
      const objetivo = crearUsuario();
      Usuario.findByPk.mockResolvedValue(objetivo);
      req.params.id = '3';
      req.body.rol = 'cocinero';

      await AdminController.cambiarRol(req, res);

      expect(objetivo.update).toHaveBeenCalledWith({ rol: 'cocinero' });
      expect(registrarEvento).toHaveBeenCalledWith(expect.objectContaining({
        tipo: 'rol_cambiado',
        detalle: { de: 'vendedor', a: 'cocinero' },
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    test('rechaza un rol inválido sin consultar la base', async () => {
      req.params.id = '3';
      req.body.rol = 'superadmin';

      await AdminController.cambiarRol(req, res);

      expect(Usuario.findByPk).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ROL_INVALIDO' }));
    });

    test('no permite cambiarse el rol a uno mismo', async () => {
      const objetivo = crearUsuario({ id_usuario: 1 });
      Usuario.findByPk.mockResolvedValue(objetivo);
      req.params.id = '1';
      req.body.rol = 'desarrollador';

      await AdminController.cambiarRol(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ROL_PROPIO' }));
      expect(objetivo.update).not.toHaveBeenCalled();
    });

    test('no quita el rol al último administrador activo', async () => {
      const objetivo = crearUsuario({ id_usuario: 9, rol: 'admin' });
      Usuario.findByPk.mockResolvedValue(objetivo);
      Usuario.count.mockResolvedValue(0);
      req.params.id = '9';
      req.body.rol = 'vendedor';

      await AdminController.cambiarRol(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ULTIMO_ADMIN' }));
      expect(objetivo.update).not.toHaveBeenCalled();
    });
  });

  describe('cambiarEstado', () => {
    test('desactiva una cuenta', async () => {
      const objetivo = crearUsuario();
      Usuario.findByPk.mockResolvedValue(objetivo);
      req.params.id = '3';
      req.body.activo = false;

      await AdminController.cambiarEstado(req, res);

      expect(objetivo.update).toHaveBeenCalledWith({ activo: false });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    test('rechaza un valor no booleano', async () => {
      req.params.id = '3';
      req.body.activo = 'no';

      await AdminController.cambiarEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ESTADO_INVALIDO' }));
    });

    test('no permite desactivar la propia cuenta', async () => {
      const objetivo = crearUsuario({ id_usuario: 1 });
      Usuario.findByPk.mockResolvedValue(objetivo);
      req.params.id = '1';
      req.body.activo = false;

      await AdminController.cambiarEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CUENTA_PROPIA' }));
    });

    test('no desactiva al último administrador activo', async () => {
      const objetivo = crearUsuario({ id_usuario: 9, rol: 'admin' });
      Usuario.findByPk.mockResolvedValue(objetivo);
      Usuario.count.mockResolvedValue(0);
      req.params.id = '9';
      req.body.activo = false;

      await AdminController.cambiarEstado(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ULTIMO_ADMIN' }));
    });
  });
});
