const crypto = require('crypto');
const config = require('../config/config');

/**
 * Política de contraseñas moderna (NIST SP 800-63B / OWASP ASVS 2.1):
 * - Longitud mínima y máxima (bcrypt trunca a 72 bytes)
 * - Sin reglas de composición artificiales
 * - Bloqueo de contraseñas comunes y de datos del propio usuario
 * - Bloqueo de contraseñas comprometidas mediante HIBP k-anonymity (opcional)
 */

const CONTRASENAS_COMUNES = new Set([
  '123456', '12345678', '123456789', '1234567890', '1234567', 'password',
  'password1', 'password123', 'contrasena', 'contraseña', 'qwerty', 'qwerty123',
  'abc123', '111111', '000000', 'iloveyou', 'admin', 'admin123', 'administrador',
  'bienvenido', 'welcome', 'welcome1', 'letmein', 'monkey', 'dragon', 'sunshine',
  'princess', 'football', 'baseball', 'master', 'shadow', 'superman', 'batman',
  'trustno1', 'passw0rd', 'p@ssw0rd', 'p@ssword', 'password!', 'password1!',
  'panqueo', 'panqueo123', 'panqueo2024', 'panqueo2025', 'panqueo2026',
  'cocina123', 'pastel123', 'reposteria', 'repostería', 'dulce123', 'capibara',
  'usuario', 'usuario123', 'invitado', 'default', 'changeme', 'secret',
  'contraseña123', 'clave123', 'micontraseña', 'mi contraseña', '987654321',
  '1q2w3e4r', '1qaz2wsx', 'zaq12wsx', 'asdfghjkl', 'zxcvbnm', 'aaaaaa',
]);

const MENSAJES = {
  requerida: 'La contraseña es obligatoria.',
  corta: `La contraseña debe tener al menos ${config.auth.passwordMinLength} caracteres.`,
  larga: `La contraseña no puede superar los ${config.auth.passwordMaxLength} caracteres.`,
  comun: 'Esa contraseña es demasiado común. Elige una diferente.',
  personal: 'La contraseña no debe contener tu nombre ni tu correo.',
  comprometida: 'Esa contraseña apareció en filtraciones de datos conocidas. Elige una diferente.',
};

const normalizar = (valor) => String(valor || '').trim().toLowerCase();

/**
 * Validación local y sincrónica. No hace llamadas de red.
 * @returns {{ok: boolean, codigo?: string, message?: string}}
 */
const evaluarPolitica = (password, { email, nombre } = {}) => {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, codigo: 'PASSWORD_REQUERIDA', message: MENSAJES.requerida };
  }

  const min = config.auth.passwordMinLength;
  const max = config.auth.passwordMaxLength;

  if (password.length < min) {
    return { ok: false, codigo: 'PASSWORD_CORTA', message: MENSAJES.corta };
  }
  if (password.length > max) {
    return { ok: false, codigo: 'PASSWORD_LARGA', message: MENSAJES.larga };
  }

  const passwordLower = normalizar(password);

  if (CONTRASENAS_COMUNES.has(passwordLower)) {
    return { ok: false, codigo: 'PASSWORD_COMUN', message: MENSAJES.comun };
  }

  if (email) {
    const local = normalizar(email).split('@')[0];
    if (local.length >= 3 && passwordLower.includes(local)) {
      return { ok: false, codigo: 'PASSWORD_PERSONAL', message: MENSAJES.personal };
    }
  }

  if (nombre) {
    const nombreLower = normalizar(nombre);
    if (nombreLower.length >= 3 && passwordLower.includes(nombreLower)) {
      return { ok: false, codigo: 'PASSWORD_PERSONAL', message: MENSAJES.personal };
    }
  }

  return { ok: true };
};

/**
 * Consulta HIBP con k-anonymity: solo se envía el prefijo SHA-1 de 5 caracteres.
 * Si el servicio no responde, se permite la contraseña (fail-open) para no
 * bloquear registros por una caída externa; queda registrado en consola.
 * @returns {Promise<boolean|null>} true comprometida, false no, null no verificable
 */
const estaComprometida = async (password) => {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefijo = sha1.slice(0, 5);
  const sufijo = sha1.slice(5);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.auth.breachCheckTimeoutMs);

  try {
    const respuesta = await fetch(`https://api.pwnedpasswords.com/range/${prefijo}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'PanQueo-PasswordPolicy' },
      signal: controller.signal,
    });

    if (!respuesta.ok) return null;

    const cuerpo = await respuesta.text();
    for (const linea of cuerpo.split('\n')) {
      const [hashSufijo, conteo] = linea.trim().split(':');
      if (hashSufijo && hashSufijo.toUpperCase() === sufijo) {
        return parseInt(conteo, 10) > 0;
      }
    }
    return false;
  } catch (error) {
    console.warn(`[auth] No se pudo verificar la contraseña contra HIBP: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Validación completa (local + filtraciones). Usar en registro y cambio de contraseña.
 * @returns {Promise<{ok: boolean, codigo?: string, message?: string}>}
 */
const validarPassword = async (password, opciones = {}) => {
  const local = evaluarPolitica(password, opciones);
  if (!local.ok) return local;

  if (!config.auth.breachCheck) return { ok: true };

  const comprometida = await estaComprometida(password);
  if (comprometida === true) {
    return { ok: false, codigo: 'PASSWORD_COMPROMETIDA', message: MENSAJES.comprometida };
  }

  return { ok: true };
};

module.exports = {
  CONTRASENAS_COMUNES,
  MENSAJES,
  evaluarPolitica,
  estaComprometida,
  validarPassword,
};
