const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { Usuario, Sesion } = require('../models');
const { hashToken } = require('../services/TokenService');

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

const errorAuth = (res, status, codigo, message) => res.status(status).json({
  status: 'error',
  code: codigo,
  message,
});

const tokenDeRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { token: authHeader.slice(7).trim(), via: 'bearer' };
  }
  const cookieToken = req.cookies?.[config.auth.sessionCookieName];
  if (cookieToken) return { token: cookieToken, via: 'cookie' };
  return null;
};

const authenticate = async (req, res, next) => {
  try {
    const extraido = tokenDeRequest(req);
    if (!extraido?.token) {
      return errorAuth(res, 401, 'NO_AUTENTICADO', 'Debes iniciar sesión.');
    }

    let decoded;
    try {
      decoded = jwt.verify(extraido.token, config.jwt.secret);
    } catch (error) {
      return errorAuth(res, 401, 'SESION_INVALIDA', 'La sesión expiró o no es válida. Inicia sesión de nuevo.');
    }

    if (decoded.scope !== 'session' || !decoded.jti) {
      return errorAuth(res, 401, 'SESION_INVALIDA', 'La sesión expiró o no es válida. Inicia sesión de nuevo.');
    }

    const sesion = await Sesion.findByPk(decoded.jti);
    if (!sesion || sesion.revocada_at || new Date(sesion.expira_at) <= new Date()) {
      return errorAuth(res, 401, 'SESION_REVOCADA', 'La sesión fue cerrada. Inicia sesión de nuevo.');
    }

    // CSRF double-submit solo para autenticación por cookie (web).
    if (extraido.via === 'cookie' && !METODOS_SEGUROS.has(req.method)) {
      const csrfRecibido = req.get('x-csrf-token');
      if (!csrfRecibido || hashToken(csrfRecibido) !== sesion.csrf_hash) {
        return errorAuth(res, 403, 'CSRF_INVALIDO', 'La solicitud no pudo verificarse. Recarga e intenta de nuevo.');
      }
    }

    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario || !usuario.activo) {
      return errorAuth(res, 401, 'USUARIO_INVALIDO', 'Tu cuenta no está disponible.');
    }

    // Última actividad (se escribe como máximo cada 5 minutos).
    const ultima = sesion.ultima_actividad_at ? new Date(sesion.ultima_actividad_at).getTime() : 0;
    if (Date.now() - ultima > 5 * 60 * 1000) {
      sesion.update({ ultima_actividad_at: new Date() }).catch(() => {});
    }

    req.usuario = usuario;
    req.sesion = sesion;
    req.sesionId = sesion.id_sesion;
    req.authVia = extraido.via;
    return next();
  } catch (error) {
    console.error('[auth] middleware:', error);
    return errorAuth(res, 401, 'SESION_INVALIDA', 'La sesión expiró o no es válida. Inicia sesión de nuevo.');
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return res.status(403).json({ status: 'error', code: 'NO_AUTORIZADO', message: 'No autorizado' });
  }
  return next();
};

module.exports = { authenticate, authorize, tokenDeRequest };
