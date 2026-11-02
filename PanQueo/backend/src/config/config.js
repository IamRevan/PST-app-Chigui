require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const nodeEnv = process.env.NODE_ENV || 'development';
const esProduccion = nodeEnv === 'production';

const entero = (valor, porDefecto) => {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
};

const lista = (valor) => String(valor || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const booleano = (valor, porDefecto = false) => {
  if (valor === undefined || valor === null || valor === '') return porDefecto;
  return String(valor).toLowerCase() === 'true';
};

const smtpPort = entero(process.env.SMTP_PORT, 587);

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  auth: {
    // Sesiones revocables en servidor (cookie httpOnly en web, Bearer en móvil)
    sessionTtlHours: entero(process.env.AUTH_SESSION_TTL_HOURS, 12),
    sessionCookieName: process.env.AUTH_SESSION_COOKIE || 'pq_session',
    csrfCookieName: process.env.AUTH_CSRF_COOKIE || 'pq_csrf',
    // Secure solo tiene sentido con HTTPS; en local (http) debe quedar desactivado.
    cookieSecure: process.env.AUTH_COOKIE_SECURE
      ? process.env.AUTH_COOKIE_SECURE === 'true'
      : esProduccion,
    cookieSameSite: process.env.AUTH_COOKIE_SAMESITE || 'lax',
    enforceHttps: process.env.AUTH_ENFORCE_HTTPS
      ? process.env.AUTH_ENFORCE_HTTPS === 'true'
      : esProduccion,
    trustProxy: process.env.TRUST_PROXY || (esProduccion ? 1 : false),
    corsOrigins: lista(process.env.CORS_ORIGINS),
    appUrl: process.env.APP_URL || (esProduccion ? 'https://app.panqueo.com' : 'http://localhost:5500'),

    // Límite de intentos y bloqueo temporal por cuenta
    maxFailedAttempts: entero(process.env.AUTH_MAX_FAILED_ATTEMPTS, 5),
    lockoutMinutes: entero(process.env.AUTH_LOCKOUT_MINUTES, 15),

    // Política moderna: longitud + bloqueo de contraseñas comprometidas
    passwordMinLength: entero(process.env.AUTH_PASSWORD_MIN_LENGTH, 12),
    passwordMaxLength: 72, // bcrypt trunca a 72 bytes
    breachCheck: process.env.PASSWORD_BREACH_CHECK !== 'off',
    breachCheckTimeoutMs: entero(process.env.PASSWORD_BREACH_TIMEOUT_MS, 3000),

    // Vigencia de tokens de verificación y recuperación
    emailVerificationTtlHours: entero(process.env.AUTH_VERIFY_TTL_HOURS, 24),
    passwordResetTtlMinutes: entero(process.env.AUTH_RESET_TTL_MINUTES, 30),

    // MFA TOTP
    mfaIssuer: process.env.AUTH_MFA_ISSUER || 'PanQueo',
    mfaWindow: entero(process.env.AUTH_MFA_WINDOW, 1),
    mfaTokenTtl: process.env.AUTH_MFA_TOKEN_TTL || '5m',
  },
  mail: {
    // Si MAIL_ENABLED no está definido, se activa automáticamente al configurar SMTP_HOST.
    enabled: booleano(process.env.MAIL_ENABLED, Boolean(process.env.SMTP_HOST)),
    host: process.env.SMTP_HOST || '',
    port: smtpPort,
    secure: booleano(process.env.SMTP_SECURE, smtpPort === 465),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'PanQueo <no-reply@panqueo.local>',
    replyTo: process.env.MAIL_REPLY_TO || '',
    timeoutMs: entero(process.env.SMTP_TIMEOUT_MS, 10000),
    tlsRejectUnauthorized: booleano(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
  },
};
