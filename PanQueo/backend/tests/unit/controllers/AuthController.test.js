const AuthController = require('../../../src/controllers/AuthController');
const { Usuario } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('register', () => {
    test('returns 400 if password does not satisfy complexity requirements', async () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@example.com',
        telefono: '12345678',
        password: 'weak',
      };

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'La contraseña debe tener entre 8 y 72 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
      });
      expect(Usuario.findOne).not.toHaveBeenCalled();
    });

    test('returns 400 if user email already exists', async () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@example.com',
        telefono: '12345678',
        password: 'ValidPass123!',
      };

      Usuario.findOne.mockResolvedValue({ id_usuario: 1, email: 'juan@example.com' });

      await AuthController.register(req, res);

      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'juan@example.com' } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'El email ya está registrado',
      });
      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test('successfully registers user with valid password', async () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@example.com',
        telefono: '12345678',
        password: 'ValidPass123!',
      };

      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue({
        id_usuario: 10,
        nombre: 'Juan',
        email: 'juan@example.com',
      });

      await AuthController.register(req, res);

      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'juan@example.com' } });
      expect(Usuario.create).toHaveBeenCalledWith({
        nombre: 'Juan',
        apellido: 'Perez',
        email: 'juan@example.com',
        telefono: '12345678',
        password: 'ValidPass123!',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          id: 10,
          nombre: 'Juan',
          email: 'juan@example.com',
        },
      });
    });
  });
});
