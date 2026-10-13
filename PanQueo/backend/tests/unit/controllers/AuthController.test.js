const { register } = require('../../../src/controllers/AuthController');
const { Usuario } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('AuthController - register', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        telefono: '+584121234567',
        password: 'PanQueo2026!',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should register a new user successfully and return status 201 without exposing password', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockResolvedValue({
      id_usuario: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      telefono: '+584121234567',
      password: '$2a$10$hashedpassword',
    });

    await register(req, res);

    expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'juan.perez@example.com' } });
    expect(Usuario.create).toHaveBeenCalledWith({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      telefono: '+584121234567',
      password: 'PanQueo2026!',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        id: 1,
        nombre: 'Juan',
        email: 'juan.perez@example.com',
      },
    });
    const jsonCallArg = res.json.mock.calls[0][0];
    expect(jsonCallArg.data.password).toBeUndefined();
  });

  it('should return 400 if email is already registered and not call Usuario.create', async () => {
    Usuario.findOne.mockResolvedValue({
      id_usuario: 2,
      email: 'juan.perez@example.com',
    });

    await register(req, res);

    expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'juan.perez@example.com' } });
    expect(Usuario.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'El email ya está registrado',
    });
  });

  it('should return 500 when database throws an error during findOne', async () => {
    Usuario.findOne.mockRejectedValue(new Error('Database connection failed'));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al registrar usuario',
    });
  });

  it('should return 500 when database throws an error during create', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockRejectedValue(new Error('Database insert failed'));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al registrar usuario',
    });
  });
});
