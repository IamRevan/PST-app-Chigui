const jwt = require('jsonwebtoken');
const { Usuario } = require('../../../src/models');
const AuthController = require('../../../src/controllers/AuthController');

jest.mock('../../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
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

  describe('login', () => {
    describe('Missing credentials validation', () => {
      it('should return 400 status if email is missing', async () => {
        req.body = { password: 'password123' };

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: 'Email y contraseña requeridos',
        });
        expect(Usuario.findOne).not.toHaveBeenCalled();
      });

      it('should return 400 status if password is missing', async () => {
        req.body = { email: 'test@example.com' };

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: 'Email y contraseña requeridos',
        });
        expect(Usuario.findOne).not.toHaveBeenCalled();
      });

      it('should return 400 status if both email and password are missing', async () => {
        req.body = {};

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: 'Email y contraseña requeridos',
        });
        expect(Usuario.findOne).not.toHaveBeenCalled();
      });
    });

    describe('User lookup and authentication failure scenarios', () => {
      it('should return 401 status if user is not found', async () => {
        req.body = { email: 'nonexistent@example.com', password: 'password123' };
        Usuario.findOne.mockResolvedValue(null);

        await AuthController.login(req, res);

        expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: 'Credenciales inválidas',
        });
        expect(jwt.sign).not.toHaveBeenCalled();
      });

      it('should return 401 status if password validation fails', async () => {
        req.body = { email: 'user@example.com', password: 'wrongpassword' };
        const mockUser = {
          id_usuario: 1,
          email: 'user@example.com',
          validarPassword: jest.fn().mockResolvedValue(false),
        };
        Usuario.findOne.mockResolvedValue(mockUser);

        await AuthController.login(req, res);

        expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
        expect(mockUser.validarPassword).toHaveBeenCalledWith('wrongpassword');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: 'Credenciales inválidas',
        });
        expect(jwt.sign).not.toHaveBeenCalled();
      });
    });

    describe('Successful login scenario', () => {
      it('should return 200 status with token and user data without hashed password', async () => {
        req.body = { email: 'user@example.com', password: 'correctpassword' };
        const mockUser = {
          id_usuario: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'user@example.com',
          rol: 'admin',
          password: '$2a$10$hashedpasswordhere',
          validarPassword: jest.fn().mockResolvedValue(true),
        };
        Usuario.findOne.mockResolvedValue(mockUser);
        jwt.sign.mockReturnValue('mocked-jwt-token');

        await AuthController.login(req, res);

        expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
        expect(mockUser.validarPassword).toHaveBeenCalledWith('correctpassword');
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: mockUser.id_usuario, rol: mockUser.rol },
          expect.any(String),
          expect.objectContaining({ expiresIn: expect.any(String) })
        );
        expect(res.json).toHaveBeenCalledWith({
          status: 'success',
          data: {
            token: 'mocked-jwt-token',
            user: {
              id: 1,
              nombre: 'Juan',
              apellido: 'Pérez',
              email: 'user@example.com',
              rol: 'admin',
            },
          },
        });

        const jsonCallArg = res.json.mock.calls[0][0];
        expect(jsonCallArg.data.user).not.toHaveProperty('password');
      });
    });

    describe('Server error handling', () => {
      it('should return 500 status on database failure', async () => {
        req.body = { email: 'user@example.com', password: 'password123' };
        Usuario.findOne.mockRejectedValue(new Error('Database connection failed'));

        await AuthController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          status: 'error',
          message: 'Error interno del servidor',
        });
      });
    });
  });
});
