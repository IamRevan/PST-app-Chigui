const { rateLimit } = require('express-rate-limit');
const config = require('../config/config');

const mensajeLimite = (message) => ({
  status: 'error',
  code: 'DEMASIADOS_INTENTOS',
  message,
});

const crearLimite = ({ windowMs, limit, message, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests,
  message: mensajeLimite(message),
});

// 10 intentos fallidos por IP cada 15 minutos; los login exitosos no consumen cupo.
const loginLimiter = crearLimite({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_LOGIN_RATE_LIMIT || 10),
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo.',
});

const registerLimiter = crearLimite({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.AUTH_REGISTER_RATE_LIMIT || 10),
  message: 'Demasiados registros desde esta conexión. Intenta más tarde.',
});

const recoveryLimiter = crearLimite({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RECOVERY_RATE_LIMIT || 5),
  message: 'Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.',
});

const mfaLimiter = crearLimite({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_MFA_RATE_LIMIT || 10),
  message: 'Demasiados intentos de verificación. Espera unos minutos.',
});

/**
 * Fuerza HTTPS en producción. Detrás de un proxy se apoya en X-Forwarded-Proto
 * (requiere app.set('trust proxy', ...)).
 */
const requireHttps = (req, res, next) => {
  if (!config.auth.enforceHttps) return next();
  if (req.secure || req.get('x-forwarded-proto') === 'https') return next();

  return res.status(403).json({
    status: 'error',
    code: 'HTTPS_REQUERIDO',
    message: 'Esta API solo acepta conexiones seguras (HTTPS).',
  });
};

module.exports = {
  loginLimiter,
  registerLimiter,
  recoveryLimiter,
  mfaLimiter,
  requireHttps,
};
