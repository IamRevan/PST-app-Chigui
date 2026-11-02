const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const config = require('../config/config');
const { Sesion } = require('../models');
const { hashToken } = require('./TokenService');
const { ipDe, userAgentDe } = require('./AuditService');

const esClienteMovil = (req) => String(req?.get?.('x-client-type') || '').toLowerCase() === 'mobile';

const opcionesCookieSesion = (maxAgeMs) => ({
  httpOnly: true,
  secure: config.auth.cookieSecure,
  sameSite: config.auth.cookieSameSite,
  path: '/',
  ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
});

const opcionesCookieCsrf = (maxAgeMs) => ({
  httpOnly: false,
  secure: config.auth.cookieSecure,
  sameSite: config.auth.cookieSameSite,
  path: '/',
  ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
});

const limpiarCookies = (res) => {
  if (!res?.clearCookie) return;
  res.clearCookie(config.auth.sessionCookieName, { path: '/' });
  res.clearCookie(config.auth.csrfCookieName, { path: '/' });
};

/**
 * Crea una sesión revocable y emite el JWT correspondiente.
 * - Web: cookie httpOnly + cookie CSRF legible por JS (double submit).
 * - Móvil: token en el cuerpo de la respuesta (Bearer).
 */
const crearSesion = async ({ usuario, req, res, via = 'cookie' }) => {
  const jti = crypto.randomUUID();
  const csrfToken = crypto.randomBytes(24).toString('base64url');
  const ttlMs = config.auth.sessionTtlHours * 60 * 60 * 1000;
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + ttlMs);

  await Sesion.create({
    id_sesion: jti,
    id_usuario: usuario.id_usuario,
    csrf_hash: hashToken(csrfToken),
    creada_at: ahora,
    expira_at: expira,
    ultima_actividad_at: ahora,
    ip: ipDe(req),
    user_agent: userAgentDe(req),
  });

  const token = jwt.sign(
    {
      id: usuario.id_usuario,
      rol: usuario.rol,
      jti,
      scope: 'session',
    },
    config.jwt.secret,
    { expiresIn: `${config.auth.sessionTtlHours}h` }
  );

  if (via === 'cookie' && res?.cookie) {
    res.cookie(
      config.auth.sessionCookieName,
      token,
      opcionesCookieSesion(ttlMs)
    );
    res.cookie(
      config.auth.csrfCookieName,
      csrfToken,
      opcionesCookieCsrf(ttlMs)
    );
  }

  return { token, csrfToken, sesionId: jti, expira };
};

const revocarSesion = async (sesion, motivo = 'logout') => {
  if (!sesion || sesion.revocada_at) return;
  await sesion.update({ revocada_at: new Date(), motivo_revocacion: motivo });
};

const revocarTodasLasSesiones = async (idUsuario, motivo = 'logout_global', exceptoId = null) => {
  const where = {
    id_usuario: idUsuario,
    revocada_at: null,
  };
  if (exceptoId) {
    where.id_sesion = { [Op.ne]: exceptoId };
  }
  await Sesion.update(
    { revocada_at: new Date(), motivo_revocacion: motivo },
    { where }
  );
};

const serializarUsuario = (usuario) => {
  if (!usuario) return null;
  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    email_verificado: Boolean(usuario.email_verificado_at),
    mfa_habilitado: Boolean(usuario.mfa_enabled),
  };
};

module.exports = {
  esClienteMovil,
  opcionesCookieSesion,
  opcionesCookieCsrf,
  limpiarCookies,
  crearSesion,
  revocarSesion,
  revocarTodasLasSesiones,
  serializarUsuario,
};
