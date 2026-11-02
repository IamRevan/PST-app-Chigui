const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const config = require('../config/config');
const { Usuario, Sesion, TokenAuth, AuthEvento } = require('../models');
const { validarPassword } = require('../services/PasswordPolicy');
const { generarToken, hashToken } = require('../services/TokenService');
const TotpService = require('../services/TotpService');
const { registrarEvento } = require('../services/AuditService');
const SessionService = require('../services/SessionService');
const EmailService = require('../services/EmailService');

// Hash de relleno: iguala el tiempo de respuesta cuando el correo no existe.
const DUMMY_HASH = '$2a$12$7B1k2lJW5vOcs2zfwCZPcODz.LCef5NKvAKo7H9a0nVgMJfIvtYja';

const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos.';
const MENSAJE_REGISTRO = 'Si los datos son válidos, enviaremos las instrucciones de verificación al correo indicado.';
const MENSAJE_RECUPERACION = 'Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.';

const TIPO_TOKEN_VERIFICACION = 'verificacion_email';
const TIPO_TOKEN_RECUPERACION = 'recuperacion_password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizarEmail = (email) => String(email || '').trim().toLowerCase();

const texto = (valor) => String(valor ?? '').trim();

const respuestaError = (res, status, codigo, message, data) => res.status(status).json({
  status: 'error',
  code: codigo,
  message,
  ...(data ? { data } : {}),
});

const esProduccion = () => config.nodeEnv === 'production';

// Costo objetivo de bcrypt. Los hashes sembrados con el valor antiguo (10) se
// actualizan de forma transparente la próxima vez que el usuario inicia sesión.
const BCRYPT_ROUNDS_OBJETIVO = 12;

const costoBcrypt = (hash) => {
  const coincidencia = /^\$2[aby]?\$(\d{2})\$/.exec(String(hash || ''));
  return coincidencia ? Number(coincidencia[1]) : 0;
};

const rehashPasswordSiNecesario = async (usuario, password) => {
  if (costoBcrypt(usuario.password) >= BCRYPT_ROUNDS_OBJETIVO) return false;
  if (typeof usuario.save !== 'function') return false;

  try {
    // El hook beforeUpdate del modelo aplica bcrypt con el costo configurado.
    usuario.password = password;
    await usuario.save();
    console.log(`[auth] Hash de contraseña migrado a bcrypt ${BCRYPT_ROUNDS_OBJETIVO} (usuario ${usuario.id_usuario}).`);
    return true;
  } catch (error) {
    console.error('[auth] No se pudo migrar el hash de la contraseña:', error.message);
    return false;
  }
};

// Los enlaces de verificación/recuperación viajan únicamente por correo (SMTP).
// Ya no se exponen tokens de desarrollo en la respuesta de la API.
const datosDevToken = () => ({});

const enlaceDe = (tipo, token) => {
  const parametro = tipo === TIPO_TOKEN_VERIFICACION ? 'verify' : 'reset';
  return `${config.auth.appUrl}/?${parametro}=${encodeURIComponent(token)}`;
};

const registrarFalloLogin = async (usuario) => {
  const intentos = Number(usuario.failed_login_attempts || 0) + 1;
  const cambios = { failed_login_attempts: intentos };

  if (intentos >= config.auth.maxFailedAttempts) {
    cambios.locked_until = new Date(Date.now() + config.auth.lockoutMinutes * 60 * 1000);
  }

  await usuario.update(cambios);
  return cambios;
};

const limpiarBloqueoVencido = async (usuario) => {
  if (!usuario?.locked_until) return;
  if (new Date(usuario.locked_until) > new Date()) return;
  await usuario.update({ locked_until: null, failed_login_attempts: 0 });
  usuario.locked_until = null;
  usuario.failed_login_attempts = 0;
};

const crearTokenPersistido = async ({ usuario, tipo }) => {
  await TokenAuth.update(
    { usado_at: new Date() },
    { where: { id_usuario: usuario.id_usuario, tipo, usado_at: null } }
  );

  const { token, hash } = generarToken();
  const ttlMs = tipo === TIPO_TOKEN_VERIFICACION
    ? config.auth.emailVerificationTtlHours * 60 * 60 * 1000
    : config.auth.passwordResetTtlMinutes * 60 * 1000;

  await TokenAuth.create({
    id_usuario: usuario.id_usuario,
    tipo,
    token_hash: hash,
    expira_at: new Date(Date.now() + ttlMs),
    created_at: new Date(),
  });

  const enlace = enlaceDe(tipo, token);

  // El envío es asíncrono: la respuesta no debe esperar al SMTP ni revelar por
  // tiempos si el correo existe. EmailService nunca lanza hacia el controlador.
  EmailService.enviarCorreoAutenticacion({ usuario, tipo, enlace }).catch((error) => {
    console.error('[auth] No se pudo enviar el correo de autenticación:', error.message);
  });

  if (!esProduccion()) {
    console.log(`[auth] Enlace (${tipo}) para ${usuario.email}: ${enlace}`);
  }

  return { token, enlace };
};

const buscarTokenVigente = async (token, tipo) => {
  if (!token) return null;
  const registro = await TokenAuth.findOne({
    where: { token_hash: hashToken(token), tipo, usado_at: null },
  });
  if (!registro) return null;
  if (new Date(registro.expira_at) <= new Date()) return null;
  return registro;
};

const emitirSesion = async ({ req, res, usuario, via }) => {
  const sesion = await SessionService.crearSesion({ usuario, req, res, via });

  return res.json({
    status: 'success',
    data: {
      user: SessionService.serializarUsuario(usuario),
      csrf_token: sesion.csrfToken,
      expira_at: sesion.expira,
      ...(via === 'bearer' ? { token: sesion.token } : {}),
    },
  });
};

const resolverVia = (req) => (SessionService.esClienteMovil(req) ? 'bearer' : 'cookie');

/**
 * Valida TOTP o, si se permite, un código de recuperación de un solo uso.
 * @returns {{ok: boolean, step?: number|null, codigosRestantes?: string[], usadoRecuperacion?: boolean}}
 */
const verificarSegundoFactor = (usuario, codigo, { permitirRecuperacion = true } = {}) => {
  const limpio = texto(codigo);

  if (permitirRecuperacion) {
    const hashes = Array.isArray(usuario.mfa_recovery_codes) ? usuario.mfa_recovery_codes : [];
    const indice = TotpService.indiceCodigoRecuperacion(limpio, hashes);
    if (indice >= 0) {
      return {
        ok: true,
        step: null,
        usadoRecuperacion: true,
        codigosRestantes: hashes.filter((_, i) => i !== indice),
      };
    }
  }

  const resultado = TotpService.verificarCodigo(usuario.mfa_secret, limpio, {
    ultimoStep: usuario.mfa_last_step,
  });

  return { ok: resultado.ok, step: resultado.step ?? null, usadoRecuperacion: false };
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const email = normalizarEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'Correo y contraseña son obligatorios.');
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      // Comparación falsa para no filtrar la existencia de la cuenta por tiempo.
      await bcrypt.compare(String(password), DUMMY_HASH);
      await registrarEvento({ req, email, tipo: 'login_fallido', exito: false, detalle: { motivo: 'cuenta_inexistente' } });
      return respuestaError(res, 401, 'CREDENCIALES_INVALIDAS', MENSAJE_CREDENCIALES);
    }

    await limpiarBloqueoVencido(usuario);

    if (usuario.estaBloqueado ? usuario.estaBloqueado() : Boolean(usuario.locked_until && new Date(usuario.locked_until) > new Date())) {
      await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'login_bloqueado', exito: false });
      const minutos = Math.max(1, Math.ceil((new Date(usuario.locked_until) - Date.now()) / 60000));
      return res.status(429).json({
        status: 'error',
        code: 'CUENTA_BLOQUEADA',
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto${minutos === 1 ? '' : 's'}.`,
        data: { retry_after_minutos: minutos },
      });
    }

    const passwordValida = await usuario.validarPassword(password);
    if (!passwordValida) {
      const cambios = await registrarFalloLogin(usuario);
      await registrarEvento({
        req,
        id_usuario: usuario.id_usuario,
        email,
        tipo: 'login_fallido',
        exito: false,
        detalle: { intentos: cambios.failed_login_attempts },
      });
      return respuestaError(res, 401, 'CREDENCIALES_INVALIDAS', MENSAJE_CREDENCIALES);
    }

    if (!usuario.activo) {
      await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'login_rechazado', exito: false, detalle: { motivo: 'inactivo' } });
      return respuestaError(res, 403, 'CUENTA_INACTIVA', 'Esta cuenta está desactivada. Contacta al administrador.');
    }

    if (!usuario.email_verificado_at) {
      await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'login_rechazado', exito: false, detalle: { motivo: 'email_no_verificado' } });
      return respuestaError(
        res,
        403,
        'EMAIL_NO_VERIFICADO',
        'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada o solicita un nuevo enlace.'
      );
    }

    await usuario.update({ failed_login_attempts: 0, locked_until: null });

    // Migra hashes antiguos (bcrypt 10) a 12 sin pedir nada al usuario.
    await rehashPasswordSiNecesario(usuario, password);

    if (usuario.mfa_enabled) {
      const mfaToken = jwt.sign(
        { id: usuario.id_usuario, scope: 'mfa' },
        config.jwt.secret,
        { expiresIn: config.auth.mfaTokenTtl, audience: 'mfa' }
      );

      await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'mfa_reto', exito: true });

      return res.json({
        status: 'mfa_required',
        code: 'MFA_REQUERIDO',
        message: 'Ingresa el código de tu aplicación autenticadora.',
        data: { mfa_token: mfaToken, metodo: 'totp' },
      });
    }

    await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'login_exitoso', exito: true });
    return emitirSesion({ req, res, usuario, via: resolverVia(req) });
  } catch (error) {
    console.error('[auth] login:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const nombre = texto(req.body?.nombre);
    const apellido = texto(req.body?.apellido);
    const email = normalizarEmail(req.body?.email);
    const telefono = texto(req.body?.telefono);
    const password = req.body?.password;

    if (!nombre || !apellido || !email || !telefono || !password) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'Completa todos los campos obligatorios.');
    }

    if (!EMAIL_RE.test(email)) {
      return respuestaError(res, 400, 'EMAIL_INVALIDO', 'Ingresa un correo electrónico válido.');
    }

    const politica = await validarPassword(password, { email, nombre });
    if (!politica.ok) {
      return respuestaError(res, 400, politica.codigo, politica.message);
    }

    const existe = await Usuario.findOne({ where: { email } });

    if (existe) {
      // Respuesta genérica para no revelar qué correos ya están registrados.
      await registrarEvento({ req, email, tipo: 'registro_duplicado', exito: false });
      return res.status(201).json({
        status: 'success',
        message: MENSAJE_REGISTRO,
        data: { requiere_verificacion: true },
      });
    }

    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      telefono,
      password,
      rol: 'vendedor', // mínimo privilegio: el alta pública nunca concede admin
      email_verificado_at: null,
      password_changed_at: new Date(),
    });

    const { token, enlace } = await crearTokenPersistido({ usuario, tipo: TIPO_TOKEN_VERIFICACION });

    await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'registro', exito: true });

    return res.status(201).json({
      status: 'success',
      message: MENSAJE_REGISTRO,
      data: {
        requiere_verificacion: true,
        ...datosDevToken(token, enlace),
      },
    });
  } catch (error) {
    console.error('[auth] register:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/verificar-email
exports.verificarEmail = async (req, res) => {
  try {
    const token = texto(req.body?.token);
    if (!token) {
      return respuestaError(res, 400, 'TOKEN_REQUERIDO', 'El enlace de verificación no es válido o ya expiró.');
    }

    const registro = await buscarTokenVigente(token, TIPO_TOKEN_VERIFICACION);
    if (!registro) {
      return respuestaError(res, 400, 'TOKEN_INVALIDO', 'El enlace de verificación no es válido o ya expiró.');
    }

    const usuario = await Usuario.findByPk(registro.id_usuario);
    if (!usuario) {
      return respuestaError(res, 400, 'TOKEN_INVALIDO', 'El enlace de verificación no es válido o ya expiró.');
    }

    if (!usuario.email_verificado_at) {
      await usuario.update({ email_verificado_at: new Date() });
    }
    await registro.update({ usado_at: new Date() });

    await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'email_verificado', exito: true });

    return res.json({
      status: 'success',
      message: 'Correo verificado correctamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    console.error('[auth] verificarEmail:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/reenviar-verificacion
exports.reenviarVerificacion = async (req, res) => {
  try {
    const email = normalizarEmail(req.body?.email);
    if (!email) {
      return respuestaError(res, 400, 'EMAIL_REQUERIDO', 'Ingresa tu correo electrónico.');
    }

    const usuario = await Usuario.findOne({ where: { email } });
    let datos = {};

    if (usuario && !usuario.email_verificado_at && usuario.activo) {
      const { token, enlace } = await crearTokenPersistido({ usuario, tipo: TIPO_TOKEN_VERIFICACION });
      datos = datosDevToken(token, enlace);
    }

    await registrarEvento({ req, id_usuario: usuario?.id_usuario || null, email, tipo: 'verificacion_reenviada', exito: true });

    return res.json({
      status: 'success',
      message: 'Si el correo está registrado y pendiente de verificación, enviaremos un nuevo enlace.',
      data: datos,
    });
  } catch (error) {
    console.error('[auth] reenviarVerificacion:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/solicitar-recuperacion
exports.solicitarRecuperacion = async (req, res) => {
  try {
    const email = normalizarEmail(req.body?.email);
    if (!email) {
      return respuestaError(res, 400, 'EMAIL_REQUERIDO', 'Ingresa tu correo electrónico.');
    }

    const usuario = await Usuario.findOne({ where: { email } });
    let datos = {};

    if (usuario && usuario.activo) {
      const { token, enlace } = await crearTokenPersistido({ usuario, tipo: TIPO_TOKEN_RECUPERACION });
      datos = datosDevToken(token, enlace);
    }

    await registrarEvento({ req, id_usuario: usuario?.id_usuario || null, email, tipo: 'recuperacion_solicitada', exito: true });

    return res.json({
      status: 'success',
      message: MENSAJE_RECUPERACION,
      data: datos,
    });
  } catch (error) {
    console.error('[auth] solicitarRecuperacion:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/restablecer-password
exports.restablecerPassword = async (req, res) => {
  try {
    const token = texto(req.body?.token);
    const password = req.body?.password;

    if (!token || !password) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'El enlace no es válido o falta la nueva contraseña.');
    }

    const registro = await buscarTokenVigente(token, TIPO_TOKEN_RECUPERACION);
    if (!registro) {
      return respuestaError(res, 400, 'TOKEN_INVALIDO', 'El enlace no es válido o expiró. Solicita uno nuevo.');
    }

    const usuario = await Usuario.findByPk(registro.id_usuario);
    if (!usuario) {
      return respuestaError(res, 400, 'TOKEN_INVALIDO', 'El enlace no es válido o expiró. Solicita uno nuevo.');
    }

    const politica = await validarPassword(password, { email: usuario.email, nombre: usuario.nombre });
    if (!politica.ok) {
      return respuestaError(res, 400, politica.codigo, politica.message);
    }

    if (await usuario.validarPassword(password)) {
      return respuestaError(res, 400, 'PASSWORD_REPETIDA', 'La nueva contraseña debe ser diferente a la anterior.');
    }

    await usuario.update({
      password,
      password_changed_at: new Date(),
      failed_login_attempts: 0,
      locked_until: null,
    });
    await registro.update({ usado_at: new Date() });
    await TokenAuth.update(
      { usado_at: new Date() },
      { where: { id_usuario: usuario.id_usuario, tipo: TIPO_TOKEN_RECUPERACION, usado_at: null } }
    );
    await SessionService.revocarTodasLasSesiones(usuario.id_usuario, 'password_restablecida');

    await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'password_restablecida', exito: true });

    return res.json({
      status: 'success',
      message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
    });
  } catch (error) {
    console.error('[auth] restablecerPassword:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/mfa/verificar
exports.verificarMfa = async (req, res) => {
  try {
    const { mfa_token: mfaToken, code } = req.body || {};

    if (!mfaToken || !code) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'Ingresa el código de verificación.');
    }

    let payload;
    try {
      payload = jwt.verify(mfaToken, config.jwt.secret, { audience: 'mfa' });
    } catch (error) {
      return respuestaError(res, 401, 'MFA_TOKEN_INVALIDO', 'La verificación expiró. Inicia sesión de nuevo.');
    }

    if (payload.scope !== 'mfa') {
      return respuestaError(res, 401, 'MFA_TOKEN_INVALIDO', 'La verificación expiró. Inicia sesión de nuevo.');
    }

    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario || !usuario.activo || !usuario.mfa_enabled || !usuario.mfa_secret) {
      return respuestaError(res, 401, 'MFA_TOKEN_INVALIDO', 'La verificación expiró. Inicia sesión de nuevo.');
    }

    const resultado = verificarSegundoFactor(usuario, code);

    if (!resultado.ok) {
      await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'mfa_fallido', exito: false });
      return respuestaError(res, 401, 'MFA_INVALIDO', 'Código de verificación inválido.');
    }

    const cambios = { failed_login_attempts: 0, locked_until: null };
    if (resultado.usadoRecuperacion) {
      cambios.mfa_recovery_codes = resultado.codigosRestantes;
      await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'mfa_recuperacion_usada', exito: true });
    } else {
      cambios.mfa_last_step = resultado.step;
    }

    await usuario.update(cambios);
    await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'login_exitoso', exito: true, detalle: { mfa: true } });

    return emitirSesion({ req, res, usuario, via: resolverVia(req) });
  } catch (error) {
    console.error('[auth] verificarMfa:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// GET /auth/mfa/estado
exports.mfaEstado = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    const codigos = Array.isArray(usuario.mfa_recovery_codes) ? usuario.mfa_recovery_codes : [];

    return res.json({
      status: 'success',
      data: {
        habilitado: Boolean(usuario.mfa_enabled),
        pendiente: Boolean(usuario.mfa_pending_secret),
        codigos_restantes: codigos.length,
      },
    });
  } catch (error) {
    console.error('[auth] mfaEstado:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/mfa/iniciar
exports.mfaIniciar = async (req, res) => {
  try {
    const password = req.body?.password;
    if (!password) {
      return respuestaError(res, 400, 'PASSWORD_REQUERIDA', 'Confirma tu contraseña para activar MFA.');
    }

    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    if (!(await usuario.validarPassword(password))) {
      return respuestaError(res, 401, 'PASSWORD_INCORRECTA', 'La contraseña no es correcta.');
    }

    if (usuario.mfa_enabled) {
      return respuestaError(res, 400, 'MFA_YA_ACTIVO', 'La verificación en dos pasos ya está activa.');
    }

    const secreto = TotpService.generarSecreto();
    await usuario.update({ mfa_pending_secret: secreto });

    return res.json({
      status: 'success',
      data: {
        secreto,
        otpauth_uri: TotpService.otpauthUri({ secreto, email: usuario.email }),
        emisor: config.auth.mfaIssuer,
        algoritmo: 'SHA1',
        digitos: 6,
        periodo: 30,
      },
    });
  } catch (error) {
    console.error('[auth] mfaIniciar:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/mfa/activar
exports.mfaActivar = async (req, res) => {
  try {
    const code = texto(req.body?.code);
    if (!code) {
      return respuestaError(res, 400, 'CODIGO_REQUERIDO', 'Ingresa el código de tu aplicación autenticadora.');
    }

    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');
    if (!usuario.mfa_pending_secret) {
      return respuestaError(res, 400, 'MFA_SIN_INICIAR', 'Primero inicia la configuración de MFA.');
    }

    const resultado = TotpService.verificarCodigo(usuario.mfa_pending_secret, code);
    if (!resultado.ok) {
      return respuestaError(res, 400, 'MFA_INVALIDO', 'El código no es válido. Verifica la hora de tu dispositivo e intenta de nuevo.');
    }

    const { codigos, hashes } = TotpService.generarCodigosRecuperacion();

    await usuario.update({
      mfa_secret: usuario.mfa_pending_secret,
      mfa_pending_secret: null,
      mfa_enabled: true,
      mfa_recovery_codes: hashes,
      mfa_last_step: resultado.step,
    });

    await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'mfa_activado', exito: true });

    return res.json({
      status: 'success',
      message: 'Verificación en dos pasos activada. Guarda tus códigos de recuperación.',
      data: { codigos_recuperacion: codigos },
    });
  } catch (error) {
    console.error('[auth] mfaActivar:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/mfa/desactivar
exports.mfaDesactivar = async (req, res) => {
  try {
    const password = req.body?.password;
    const code = texto(req.body?.code);
    if (!password || !code) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'Confirma tu contraseña e ingresa un código.');
    }

    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    if (!(await usuario.validarPassword(password))) {
      return respuestaError(res, 401, 'PASSWORD_INCORRECTA', 'La contraseña no es correcta.');
    }

    if (!usuario.mfa_enabled || !usuario.mfa_secret) {
      return respuestaError(res, 400, 'MFA_NO_ACTIVO', 'La verificación en dos pasos no está activa.');
    }

    const resultado = verificarSegundoFactor(usuario, code);
    if (!resultado.ok) {
      return respuestaError(res, 400, 'MFA_INVALIDO', 'Código de verificación inválido.');
    }

    await usuario.update({
      mfa_enabled: false,
      mfa_secret: null,
      mfa_pending_secret: null,
      mfa_recovery_codes: null,
      mfa_last_step: null,
    });

    await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'mfa_desactivado', exito: true });

    return res.json({ status: 'success', message: 'Verificación en dos pasos desactivada.' });
  } catch (error) {
    console.error('[auth] mfaDesactivar:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// GET /auth/perfil
exports.perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    return res.json({
      status: 'success',
      data: {
        ...SessionService.serializarUsuario(usuario),
        sesion: req.sesion ? {
          creada_at: req.sesion.creada_at,
          expira_at: req.sesion.expira_at,
          via: req.authVia,
        } : null,
      },
    });
  } catch (error) {
    console.error('[auth] perfil:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error al obtener perfil');
  }
};

// PUT /auth/perfil
exports.actualizarPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    const cambios = {};
    if (req.body?.nombre !== undefined) cambios.nombre = texto(req.body.nombre);
    if (req.body?.apellido !== undefined) cambios.apellido = texto(req.body.apellido);
    if (req.body?.telefono !== undefined) cambios.telefono = texto(req.body.telefono);

    if (Object.values(cambios).some((valor) => !valor)) {
      return respuestaError(res, 400, 'DATOS_INVALIDOS', 'Nombre, apellido y teléfono no pueden estar vacíos.');
    }

    await usuario.update(cambios);

    return res.json({ status: 'success', data: SessionService.serializarUsuario(usuario) });
  } catch (error) {
    console.error('[auth] actualizarPerfil:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error al actualizar perfil');
  }
};

// POST /auth/cambiar-password
exports.cambiarPassword = async (req, res) => {
  try {
    const actual = req.body?.password_actual;
    const nueva = req.body?.password_nueva;

    if (!actual || !nueva) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'Ingresa tu contraseña actual y la nueva.');
    }

    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    if (!(await usuario.validarPassword(actual))) {
      await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'cambio_password_rechazado', exito: false });
      return respuestaError(res, 401, 'PASSWORD_INCORRECTA', 'La contraseña actual no es correcta.');
    }

    const politica = await validarPassword(nueva, { email: usuario.email, nombre: usuario.nombre });
    if (!politica.ok) {
      return respuestaError(res, 400, politica.codigo, politica.message);
    }

    if (await usuario.validarPassword(nueva)) {
      return respuestaError(res, 400, 'PASSWORD_REPETIDA', 'La nueva contraseña debe ser diferente a la actual.');
    }

    await usuario.update({ password: nueva, password_changed_at: new Date() });
    await SessionService.revocarTodasLasSesiones(usuario.id_usuario, 'password_cambiada', req.sesionId);
    await registrarEvento({ req, id_usuario: usuario.id_usuario, email: usuario.email, tipo: 'password_cambiada', exito: true });

    return res.json({
      status: 'success',
      message: 'Contraseña actualizada. Cerramos las demás sesiones por seguridad.',
    });
  } catch (error) {
    console.error('[auth] cambiarPassword:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/cambiar-email
exports.cambiarEmail = async (req, res) => {
  try {
    const password = req.body?.password;
    const email = normalizarEmail(req.body?.email);

    if (!password || !email) {
      return respuestaError(res, 400, 'DATOS_REQUERIDOS', 'Confirma tu contraseña e ingresa el nuevo correo.');
    }
    if (!EMAIL_RE.test(email)) {
      return respuestaError(res, 400, 'EMAIL_INVALIDO', 'Ingresa un correo electrónico válido.');
    }

    const usuario = await Usuario.findByPk(req.usuario.id_usuario);
    if (!usuario) return respuestaError(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado');

    if (!(await usuario.validarPassword(password))) {
      return respuestaError(res, 401, 'PASSWORD_INCORRECTA', 'La contraseña no es correcta.');
    }

    if (email === normalizarEmail(usuario.email)) {
      return respuestaError(res, 400, 'EMAIL_SIN_CAMBIOS', 'El correo es el mismo que ya tienes registrado.');
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return respuestaError(res, 409, 'EMAIL_NO_DISPONIBLE', 'No se pudo actualizar el correo.');
    }

    await usuario.update({ email, email_verificado_at: null });
    const { token, enlace } = await crearTokenPersistido({ usuario, tipo: TIPO_TOKEN_VERIFICACION });
    await SessionService.revocarTodasLasSesiones(usuario.id_usuario, 'email_cambiado', req.sesionId);
    await registrarEvento({ req, id_usuario: usuario.id_usuario, email, tipo: 'email_cambiado', exito: true });

    return res.json({
      status: 'success',
      message: 'Correo actualizado. Verifica tu nueva dirección para continuar.',
      data: {
        requiere_verificacion: true,
        ...datosDevToken(token, enlace),
      },
    });
  } catch (error) {
    console.error('[auth] cambiarEmail:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// GET /auth/sesiones
exports.listarSesiones = async (req, res) => {
  try {
    const sesiones = await Sesion.findAll({
      where: {
        id_usuario: req.usuario.id_usuario,
        revocada_at: null,
        expira_at: { [Op.gt]: new Date() },
      },
      order: [['creada_at', 'DESC']],
    });

    return res.json({
      status: 'success',
      data: sesiones.map((sesion) => ({
        id: sesion.id_sesion,
        actual: sesion.id_sesion === req.sesionId,
        creada_at: sesion.creada_at,
        expira_at: sesion.expira_at,
        ultima_actividad_at: sesion.ultima_actividad_at,
        ip: sesion.ip,
        user_agent: sesion.user_agent,
      })),
    });
  } catch (error) {
    console.error('[auth] listarSesiones:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// DELETE /auth/sesiones/:id
exports.revocarSesionPorId = async (req, res) => {
  try {
    const sesion = await Sesion.findOne({
      where: { id_sesion: req.params.id, id_usuario: req.usuario.id_usuario },
    });

    if (!sesion) return respuestaError(res, 404, 'NO_ENCONTRADA', 'Sesión no encontrada.');

    await SessionService.revocarSesion(sesion, 'revocada_por_usuario');
    if (sesion.id_sesion === req.sesionId) SessionService.limpiarCookies(res);
    await registrarEvento({ req, id_usuario: req.usuario.id_usuario, tipo: 'sesion_revocada', exito: true });

    return res.json({ status: 'success', message: 'Sesión cerrada.' });
  } catch (error) {
    console.error('[auth] revocarSesionPorId:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// GET /auth/eventos
exports.eventos = async (req, res) => {
  try {
    const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const eventos = await AuthEvento.findAll({
      where: { id_usuario: req.usuario.id_usuario },
      order: [['created_at', 'DESC']],
      limit: limite,
    });

    return res.json({ status: 'success', data: eventos });
  } catch (error) {
    console.error('[auth] eventos:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.sesion) await SessionService.revocarSesion(req.sesion, 'logout');
    SessionService.limpiarCookies(res);
    await registrarEvento({ req, id_usuario: req.usuario?.id_usuario || null, tipo: 'logout', exito: true });
    return res.json({ status: 'success', message: 'Sesión cerrada.' });
  } catch (error) {
    console.error('[auth] logout:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};

// POST /auth/logout-todos
exports.logoutTodos = async (req, res) => {
  try {
    await SessionService.revocarTodasLasSesiones(req.usuario.id_usuario, 'logout_global');
    SessionService.limpiarCookies(res);
    await registrarEvento({ req, id_usuario: req.usuario.id_usuario, tipo: 'logout_global', exito: true });
    return res.json({ status: 'success', message: 'Cerramos todas tus sesiones.' });
  } catch (error) {
    console.error('[auth] logoutTodos:', error);
    return respuestaError(res, 500, 'ERROR_INTERNO', 'Error interno del servidor');
  }
};
