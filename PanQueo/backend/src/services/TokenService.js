const crypto = require('crypto');

/**
 * Tokens opacos de un solo uso. Solo se guarda su hash SHA-256 en la base de datos,
 * de modo que una fuga de la tabla no permite reutilizarlos.
 */
const hashToken = (token) => crypto
  .createHash('sha256')
  .update(String(token || ''))
  .digest('hex');

const generarToken = (bytes = 32) => {
  const token = crypto.randomBytes(bytes).toString('base64url');
  return { token, hash: hashToken(token) };
};

const coincideHash = (token, hashEsperado) => {
  if (!token || !hashEsperado) return false;
  const calculado = Buffer.from(hashToken(token), 'hex');
  const esperado = Buffer.from(String(hashEsperado), 'hex');
  if (calculado.length !== esperado.length) return false;
  return crypto.timingSafeEqual(calculado, esperado);
};

module.exports = { generarToken, hashToken, coincideHash };
