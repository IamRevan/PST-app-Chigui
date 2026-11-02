const crypto = require('crypto');
const config = require('../config/config');

/**
 * Implementación TOTP (RFC 6238) sin dependencias externas.
 * Secreto en base32, códigos de 6 dígitos, paso de 30 s y ventana ±1.
 */

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PASO_SEGUNDOS = 30;
const DIGITOS = 6;

const base32Encode = (buffer) => {
  let bits = 0;
  let valor = 0;
  let salida = '';

  for (const byte of buffer) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      salida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    salida += ALFABETO_BASE32[(valor << (5 - bits)) & 31];
  }
  return salida;
};

const base32Decode = (texto) => {
  const limpio = String(texto || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let valor = 0;
  const bytes = [];

  for (const caracter of limpio) {
    const indice = ALFABETO_BASE32.indexOf(caracter);
    if (indice === -1) continue;
    valor = (valor << 5) | indice;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

const generarSecreto = (bytes = 20) => base32Encode(crypto.randomBytes(bytes));

const generarCodigo = (secreto, contador) => {
  const clave = base32Decode(secreto);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(contador / 0x100000000), 0);
  buffer.writeUInt32BE(contador >>> 0, 4);

  const hmac = crypto.createHmac('sha1', clave).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binario = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);

  return String(binario % (10 ** DIGITOS)).padStart(DIGITOS, '0');
};

const pasoActual = (fecha = Date.now()) => Math.floor(fecha / 1000 / PASO_SEGUNDOS);

const codigoActual = (secreto, fecha = Date.now()) => generarCodigo(secreto, pasoActual(fecha));

const compararSeguro = (a, b) => {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
};

/**
 * Verifica un código TOTP. `ultimoStep` evita reutilizar un código ya usado.
 * @returns {{ok: boolean, step?: number}}
 */
const verificarCodigo = (secreto, codigo, {
  ventana = config.auth.mfaWindow,
  ultimoStep = null,
  fecha = Date.now(),
} = {}) => {
  if (!secreto || typeof codigo !== 'string') return { ok: false };
  const limpio = codigo.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(limpio)) return { ok: false };

  const paso = pasoActual(fecha);
  for (let delta = -ventana; delta <= ventana; delta += 1) {
    const candidato = paso + delta;
    if (ultimoStep != null && candidato <= ultimoStep) continue;
    if (compararSeguro(generarCodigo(secreto, candidato), limpio)) {
      return { ok: true, step: candidato };
    }
  }
  return { ok: false };
};

const otpauthUri = ({ secreto, email, issuer = config.auth.mfaIssuer }) => {
  const etiqueta = `${encodeURIComponent(issuer)}:${encodeURIComponent(email || '')}`;
  const params = new URLSearchParams({
    secret: secreto,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITOS),
    period: String(PASO_SEGUNDOS),
  });
  return `otpauth://totp/${etiqueta}?${params.toString()}`;
};

const normalizarCodigoRecuperacion = (codigo) => String(codigo || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '');

const hashCodigoRecuperacion = (codigo) => crypto
  .createHash('sha256')
  .update(normalizarCodigoRecuperacion(codigo))
  .digest('hex');

/** Genera códigos de recuperación de un solo uso. Devuelve texto plano y hashes. */
const generarCodigosRecuperacion = (cantidad = 10) => {
  const codigos = [];
  const hashes = [];

  for (let i = 0; i < cantidad; i += 1) {
    const bruto = crypto.randomBytes(5).toString('hex').toUpperCase();
    const codigo = `${bruto.slice(0, 5)}-${bruto.slice(5, 10)}`;
    codigos.push(codigo);
    hashes.push(hashCodigoRecuperacion(codigo));
  }

  return { codigos, hashes };
};

/** Devuelve el índice del código usado, o -1 si no coincide. */
const indiceCodigoRecuperacion = (codigo, hashes = []) => {
  const hash = hashCodigoRecuperacion(codigo);
  return (hashes || []).findIndex((guardado) => compararSeguro(guardado, hash));
};

module.exports = {
  base32Encode,
  base32Decode,
  generarSecreto,
  generarCodigo,
  codigoActual,
  verificarCodigo,
  otpauthUri,
  generarCodigosRecuperacion,
  indiceCodigoRecuperacion,
  hashCodigoRecuperacion,
  normalizarCodigoRecuperacion,
};
