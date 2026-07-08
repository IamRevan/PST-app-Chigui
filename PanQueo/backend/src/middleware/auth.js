const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { Usuario } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ status: 'error', message: 'Usuario no válido' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ status: 'error', message: 'No autorizado' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
