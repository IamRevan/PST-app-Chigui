process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario, TokenAuth, AuthEvento } = require('../../../src/models');
const AuthController = require('../../../src/controllers/AuthController');
const { validarPassword } = require('../../../src/services/PasswordPolicy');
const SessionService = require('../../../src/services/SessionService');
const { registrarEvento } = require('../../../src/services/AuditService');
const TotpService = require('../../../src/services/TotpService');

jest.mock('../../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Sesion: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  TokenAuth: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  AuthEvento: {
    findAll: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mfa-token'),
  verify: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../../src/services/PasswordPolicy', () => ({
  validarPassword: jest.fn(),
}));

jest.mock('../../../src/services/AuditService', () => ({
  registrarEvento: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/services/SessionService', () => ({
  esClienteMovil: jest.fn(() => true),
  crearSesion: jest.fn(),
  serializarUsuario: jest.fn((usuario) => ({
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    email_verificado: Boolean(usuario.email_verificado_at),
    mfa_habilitado: Boolean(usuario.mfa_enabled),
  })),
  revocarSesion: jest.fn(),
  revocarTodasLasSesiones: jest.fn(),
  limpiarCookies: jest.fn(),
}));

const crearUsuario = (extra = {}) => {
  const usuario = {
    id_usuario: 1,
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@example.com',
    telefono: '+58 412 000 0000',
    rol: 'admin',
    activo: true,
    email_verificado_at: new Date(),
    password_changed_at: new Date(),
    failed_login_attempts: 0,
    locked_until: null,
    mfa_enabled: false,
    mfa_secret: null,
    mfa_pending_secret: null,
    mfa_recovery_codes: null,
    mfa_last_step: null,
    validarPassword: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockImplementation(function actualizar(cambios) {
      Object.assign(this, cambios);
      return Promise.resolve(this);
    }),
    ...extra,
  };
  return usuario;
};

const respuestaSesion = () => ({
  token: 'jwt-session-token',
  csrfToken: 'csrf-token',
  sesionId: 'sesion-1',
  expira: new Date(Date.now() + 3600000),
});

describe('AuthController (endurecido)', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    validarPassword.mockResolvedValue({ ok: true });
    req = { body: {}, headers: {}, method: 'POST', query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    SessionService.esClienteMovil.mockReturnValue(true);
    SessionService.crearSesion.mockResolvedValue(respuestaSesion());
  });

  describe('register', () => {
    test('exige todos los campos obligatorios', async () => {
      req.body = { email: 'ana@example.com', password: 'frase larga y segura' };

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DATOS_REQUERIDOS' }));
    });

    test('valida el formato del correo', async () => {
      req.body = {
        nombre: 'Ana', apellido: 'Pérez', email: 'no-es-correo', telefono: '123', password: 'frase larga y segura',
      };

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'EMAIL_INVALIDO' }));
    });

    test('aplica la política de contraseñas', async () => {
      validarPassword.mockResolvedValue({
        ok: false,
        codigo: 'PASSWORD_CORTA',
        message: 'La contraseña debe tener al menos 12 caracteres.',
      });
      req.body = {
        nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', telefono: '123', password: 'corta',
      };

      await AuthController.register(req, res);

      expect(validarPassword).toHaveBeenCalledWith('corta', { email: 'ana@example.com', nombre: 'Ana' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'PASSWORD_CORTA' }));
      expect(Usuario.create).not.toHaveBeenCalled();
    });

    test('no revela si el correo ya existe (respuesta genérica)', async () => {
      Usuario.findOne.mockResolvedValue(crearUsuario());
      req.body = {
        nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', telefono: '123', password: 'frase larga y segura',
      };

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: { requiere_verificacion: true },
      }));
      expect(Usuario.create).not.toHaveBeenCalled();
      expect(registrarEvento).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'registro_duplicado', exito: false }));
    });

    test('crea el usuario sin verificar y genera token de verificación', async () => {
      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockImplementation(async (datos) => crearUsuario(datos));
      req.body = {
        nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.com', telefono: '123', password: 'frase larga y segura',
      };

      await AuthController.register(req, res);

      expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({
        nombre: 'Ana',
        email: 'ana@example.com',
        email_verificado_at: null,
      }));
      expect(TokenAuth.create).toHaveBeenCalledWith(expect.objectContaining({
        tipo: 'verificacion_email',
        id_usuario: 1,
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      const cuerpo = res.json.mock.calls[0][0];
      expect(cuerpo.data.requiere_verificacion).toBe(true);
      // Ya no se expone token de desarrollo: el enlace solo viaja por correo.
      expect(cuerpo.data.dev_token).toBeUndefined();
    });
  });

  describe('login', () => {
    test('exige correo y contraseña', async () => {
      req.body = { email: 'ana@example.com' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DATOS_REQUERIDOS' }));
    });

    test('responde genérico y compara contra un hash falso si el correo no existe', async () => {
      Usuario.findOne.mockResolvedValue(null);
      req.body = { email: 'nadie@example.com', password: 'lo que sea' };

      await AuthController.login(req, res);

      expect(bcrypt.compare).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Correo o contraseña incorrectos.',
      }));
      expect(SessionService.crearSesion).not.toHaveBeenCalled();
    });

    test('cuenta el intento fallido y responde genérico', async () => {
      const usuario = crearUsuario({ validarPassword: jest.fn().mockResolvedValue(false) });
      Usuario.findOne.mockResolvedValue(usuario);
      req.body = { email: 'ana@example.com', password: 'incorrecta' };

      await AuthController.login(req, res);

      expect(usuario.update).toHaveBeenCalledWith({ failed_login_attempts: 1 });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CREDENCIALES_INVALIDAS' }));
    });

    test('bloquea la cuenta temporalmente tras demasiados intentos', async () => {
      const usuario = crearUsuario({
        locked_until: new Date(Date.now() + 10 * 60 * 1000),
        estaBloqueado: () => true,
      });
      Usuario.findOne.mockResolvedValue(usuario);
      req.body = { email: 'ana@example.com', password: 'incorrecta' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CUENTA_BLOQUEADA' }));
    });

    test('exige verificar el correo antes de iniciar sesión', async () => {
      Usuario.findOne.mockResolvedValue(crearUsuario({ email_verificado_at: null }));
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'EMAIL_NO_VERIFICADO' }));
      expect(SessionService.crearSesion).not.toHaveBeenCalled();
    });

    test('inicia sesión en móvil y devuelve token Bearer', async () => {
      Usuario.findOne.mockResolvedValue(crearUsuario());
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(SessionService.crearSesion).toHaveBeenCalledWith(expect.objectContaining({ via: 'bearer' }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ token: 'jwt-session-token', csrf_token: 'csrf-token' }),
      }));
    });

    test('inicia sesión en web sin exponer el token en el cuerpo', async () => {
      SessionService.esClienteMovil.mockReturnValue(false);
      Usuario.findOne.mockResolvedValue(crearUsuario());
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(SessionService.crearSesion).toHaveBeenCalledWith(expect.objectContaining({ via: 'cookie' }));
      const cuerpo = res.json.mock.calls[0][0];
      expect(cuerpo.data.token).toBeUndefined();
      expect(cuerpo.data.csrf_token).toBe('csrf-token');
    });

    test('migra un hash bcrypt antiguo (costo 10) a costo 12 al iniciar sesión', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      Usuario.findOne.mockResolvedValue(crearUsuario({
        password: '$2a$10$abcdefghijklmnopqrstuv',
        save,
      }));
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    test('no rehashea si el hash ya está en costo 12', async () => {
      const save = jest.fn();
      Usuario.findOne.mockResolvedValue(crearUsuario({
        password: '$2a$12$abcdefghijklmnopqrstuv',
        save,
      }));
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(save).not.toHaveBeenCalled();
    });

    test('pide el segundo factor cuando MFA está activo', async () => {
      Usuario.findOne.mockResolvedValue(crearUsuario({ mfa_enabled: true }));
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, scope: 'mfa' },
        expect.any(String),
        expect.objectContaining({ audience: 'mfa' })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'mfa_required',
        code: 'MFA_REQUERIDO',
        data: expect.objectContaining({ mfa_token: 'mfa-token' }),
      }));
      expect(SessionService.crearSesion).not.toHaveBeenCalled();
    });

    test('devuelve 500 sin filtrar detalles internos', async () => {
      Usuario.findOne.mockRejectedValue(new Error('DB caída'));
      req.body = { email: 'ana@example.com', password: 'correcta' };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ERROR_INTERNO' }));
    });
  });

  describe('verificación de correo', () => {
    test('rechaza un token inexistente o vencido', async () => {
      TokenAuth.findOne.mockResolvedValue(null);
      req.body = { token: 'inventado' };

      await AuthController.verificarEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_INVALIDO' }));
    });

    test('marca el correo como verificado y consume el token', async () => {
      const usuario = crearUsuario({ email_verificado_at: null });
      const registro = {
        id_usuario: 1,
        expira_at: new Date(Date.now() + 3600000),
        update: jest.fn().mockResolvedValue(undefined),
      };
      TokenAuth.findOne.mockResolvedValue(registro);
      Usuario.findByPk.mockResolvedValue(usuario);
      req.body = { token: 'token-valido' };

      await AuthController.verificarEmail(req, res);

      expect(usuario.update).toHaveBeenCalledWith({ email_verificado_at: expect.any(Date) });
      expect(registro.update).toHaveBeenCalledWith({ usado_at: expect.any(Date) });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    test('reenviar verificación responde igual aunque el correo no exista', async () => {
      Usuario.findOne.mockResolvedValue(null);
      req.body = { email: 'nadie@example.com' };

      await AuthController.reenviarVerificacion(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: {},
      }));
      expect(TokenAuth.create).not.toHaveBeenCalled();
    });
  });

  describe('recuperación de contraseña', () => {
    test('solicitar recuperación responde genérico para correos inexistentes', async () => {
      Usuario.findOne.mockResolvedValue(null);
      req.body = { email: 'nadie@example.com' };

      await AuthController.solicitarRecuperacion(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: {},
      }));
    });

    test('restablece la contraseña, consume el token y revoca sesiones', async () => {
      const usuario = crearUsuario({ validarPassword: jest.fn().mockResolvedValue(false) });
      const registro = {
        id_usuario: 1,
        expira_at: new Date(Date.now() + 600000),
        update: jest.fn().mockResolvedValue(undefined),
      };
      TokenAuth.findOne.mockResolvedValue(registro);
      Usuario.findByPk.mockResolvedValue(usuario);
      req.body = { token: 'token-reset', password: 'nueva frase segura' };

      await AuthController.restablecerPassword(req, res);

      expect(usuario.update).toHaveBeenCalledWith(expect.objectContaining({
        password: 'nueva frase segura',
        failed_login_attempts: 0,
        locked_until: null,
      }));
      expect(SessionService.revocarTodasLasSesiones).toHaveBeenCalledWith(1, 'password_restablecida');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
  });

  describe('MFA', () => {
    test('rechaza un token de MFA inválido', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });
      req.body = { mfa_token: 'vencido', code: '123456' };

      await AuthController.verificarMfa(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'MFA_TOKEN_INVALIDO' }));
    });

    test('valida el código TOTP y emite la sesión', async () => {
      const secreto = TotpService.generarSecreto();
      const usuario = crearUsuario({ mfa_enabled: true, mfa_secret: secreto });
      jwt.verify.mockReturnValue({ id: 1, scope: 'mfa' });
      Usuario.findByPk.mockResolvedValue(usuario);
      req.body = { mfa_token: 'valido', code: TotpService.codigoActual(secreto) };

      await AuthController.verificarMfa(req, res);

      expect(usuario.update).toHaveBeenCalledWith(expect.objectContaining({
        mfa_last_step: expect.any(Number),
      }));
      expect(SessionService.crearSesion).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    test('acepta un código de recuperación y lo consume', async () => {
      const { codigos, hashes } = TotpService.generarCodigosRecuperacion(2);
      const usuario = crearUsuario({
        mfa_enabled: true,
        mfa_secret: TotpService.generarSecreto(),
        mfa_recovery_codes: hashes,
      });
      jwt.verify.mockReturnValue({ id: 1, scope: 'mfa' });
      Usuario.findByPk.mockResolvedValue(usuario);
      req.body = { mfa_token: 'valido', code: codigos[0] };

      await AuthController.verificarMfa(req, res);

      expect(usuario.update).toHaveBeenCalledWith(expect.objectContaining({
        mfa_recovery_codes: [hashes[1]],
      }));
      expect(SessionService.crearSesion).toHaveBeenCalled();
    });
  });

  describe('sesiones', () => {
    test('logout revoca la sesión actual y limpia cookies', async () => {
      req.usuario = crearUsuario();
      req.sesion = { id_sesion: 'sesion-1' };

      await AuthController.logout(req, res);

      expect(SessionService.revocarSesion).toHaveBeenCalledWith(req.sesion, 'logout');
      expect(SessionService.limpiarCookies).toHaveBeenCalledWith(res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    test('logout-todos revoca todas las sesiones del usuario', async () => {
      req.usuario = crearUsuario();

      await AuthController.logoutTodos(req, res);

      expect(SessionService.revocarTodasLasSesiones).toHaveBeenCalledWith(1, 'logout_global');
      expect(SessionService.limpiarCookies).toHaveBeenCalledWith(res);
    });

    test('lista sesiones activas y marca la actual', async () => {
      req.usuario = crearUsuario();
      req.sesionId = 'sesion-1';
      const { Sesion } = require('../../../src/models');
      Sesion.findAll.mockResolvedValue([
        {
          id_sesion: 'sesion-1',
          creada_at: new Date(),
          expira_at: new Date(Date.now() + 3600000),
          ultima_actividad_at: new Date(),
          ip: '127.0.0.1',
          user_agent: 'jest',
        },
      ]);

      await AuthController.listarSesiones(req, res);

      const cuerpo = res.json.mock.calls[0][0];
      expect(cuerpo.data[0]).toMatchObject({ id: 'sesion-1', actual: true });
    });

    test('lista eventos de autenticación del usuario', async () => {
      req.usuario = crearUsuario();
      req.query = { limit: '5' };
      AuthEvento.findAll.mockResolvedValue([{ tipo: 'login_exitoso' }]);

      await AuthController.eventos(req, res);

      expect(AuthEvento.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
  });
});
