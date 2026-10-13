/**
 * Helper y Middleware para validación de complejidad de contraseña.
 */

const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 72) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

const validatePasswordMiddleware = (req, res, next) => {
  const { password } = req.body;
  if (!isValidPassword(password)) {
    return res.status(400).json({
      status: 'error',
      message: 'La contraseña debe tener entre 8 y 72 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
    });
  }
  next();
};

module.exports = {
  isValidPassword,
  validatePasswordMiddleware,
};
