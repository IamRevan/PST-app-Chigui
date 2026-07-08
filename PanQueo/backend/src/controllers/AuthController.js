const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const config = require('../config/config');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email y contraseña requeridos' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const passwordValida = await usuario.validarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password } = req.body;

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ status: 'error', message: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({ nombre, apellido, email, telefono, password });

    res.status(201).json({
      status: 'success',
      data: { id: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al registrar usuario' });
  }
};

exports.perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: { exclude: ['password'] },
    });
    res.json({ status: 'success', data: usuario });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error al obtener perfil' });
  }
};
