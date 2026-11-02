/**
 * Compatibilidad con la validación antigua.
 * La política vigente vive en services/PasswordPolicy.js (longitud + filtraciones).
 */
const { evaluarPolitica } = require('../services/PasswordPolicy');

const isValidPassword = (password) => evaluarPolitica(password).ok;

const validatePasswordMiddleware = (req, res, next) => {
  const resultado = evaluarPolitica(req.body?.password);
  if (!resultado.ok) {
    return res.status(400).json({
      status: 'error',
      code: resultado.codigo,
      message: resultado.message,
    });
  }
  return next();
};

module.exports = {
  isValidPassword,
  validatePasswordMiddleware,
};
