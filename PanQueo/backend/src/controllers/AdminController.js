const { Op } = require('sequelize');
const { Usuario } = require('../models');
const { registrarEvento } = require('../services/AuditService');

const ROLES_VALIDOS = ['admin', 'desarrollador', 'cocinero', 'vendedor'];

const serializarAdmin = (usuario) => ({
  id: usuario.id_usuario,
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  email: usuario.email,
  telefono: usuario.telefono,
  rol: usuario.rol,
  activo: Boolean(usuario.activo),
  email_verificado: Boolean(usuario.email_verificado_at),
  mfa_habilitado: Boolean(usuario.mfa_enabled),
  creado_at: usuario.created_at,
});

const error = (res, status, codigo, message) => res.status(status).json({
  status: 'error',
  code: codigo,
  message,
});

const idDe = (valor) => {
  const n = parseInt(valor, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const esUltimoAdmin = async (idExcluido = null) => {
  const where = { rol: 'admin', activo: true };
  if (idExcluido) where.id_usuario = { [Op.ne]: idExcluido };
  const adminsActivos = await Usuario.count({ where });
  return adminsActivos === 0;
};

// GET /admin/usuarios — lista todos los usuarios.
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ order: [['id_usuario', 'ASC']] });
    return res.json({ status: 'success', data: usuarios.map(serializarAdmin) });
  } catch (err) {
    console.error('[admin] listarUsuarios:', err);
    return error(res, 500, 'ERROR_INTERNO', 'Error al listar usuarios');
  }
};

// PATCH /admin/usuarios/:id/rol — asigna o quita un rol.
exports.cambiarRol = async (req, res) => {
  try {
    const id = idDe(req.params?.id);
    const rol = String(req.body?.rol || '').trim();

    if (!id) return error(res, 400, 'ID_INVALIDO', 'Identificador de usuario inválido.');
    if (!ROLES_VALIDOS.includes(rol)) {
      return error(res, 400, 'ROL_INVALIDO', `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`);
    }

    const objetivo = await Usuario.findByPk(id);
    if (!objetivo) return error(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado.');

    if (objetivo.id_usuario === req.usuario.id_usuario) {
      return error(res, 400, 'ROL_PROPIO', 'No puedes cambiarte el rol a ti mismo.');
    }

    // Evita quedarse sin ningún administrador activo.
    if (objetivo.rol === 'admin' && rol !== 'admin' && (await esUltimoAdmin(objetivo.id_usuario))) {
      return error(res, 409, 'ULTIMO_ADMIN', 'No puedes quitar el rol del último administrador activo.');
    }

    const rolAnterior = objetivo.rol;
    await objetivo.update({ rol });

    await registrarEvento({
      req,
      id_usuario: objetivo.id_usuario,
      email: objetivo.email,
      tipo: 'rol_cambiado',
      exito: true,
      detalle: { de: rolAnterior, a: rol },
    });

    return res.json({ status: 'success', data: serializarAdmin(objetivo), message: `Rol actualizado a "${rol}".` });
  } catch (err) {
    console.error('[admin] cambiarRol:', err);
    return error(res, 500, 'ERROR_INTERNO', 'Error al cambiar el rol');
  }
};

// PATCH /admin/usuarios/:id/estado — activa o desactiva una cuenta.
exports.cambiarEstado = async (req, res) => {
  try {
    const id = idDe(req.params?.id);
    const activo = req.body?.activo;

    if (!id) return error(res, 400, 'ID_INVALIDO', 'Identificador de usuario inválido.');
    if (typeof activo !== 'boolean') {
      return error(res, 400, 'ESTADO_INVALIDO', 'El campo "activo" debe ser true o false.');
    }

    const objetivo = await Usuario.findByPk(id);
    if (!objetivo) return error(res, 404, 'NO_ENCONTRADO', 'Usuario no encontrado.');

    if (objetivo.id_usuario === req.usuario.id_usuario) {
      return error(res, 400, 'CUENTA_PROPIA', 'No puedes desactivar tu propia cuenta.');
    }

    if (objetivo.rol === 'admin' && !activo && (await esUltimoAdmin(objetivo.id_usuario))) {
      return error(res, 409, 'ULTIMO_ADMIN', 'No puedes desactivar al último administrador activo.');
    }

    await objetivo.update({ activo });

    await registrarEvento({
      req,
      id_usuario: objetivo.id_usuario,
      email: objetivo.email,
      tipo: activo ? 'usuario_activado' : 'usuario_desactivado',
      exito: true,
    });

    return res.json({
      status: 'success',
      data: serializarAdmin(objetivo),
      message: activo ? 'Cuenta activada.' : 'Cuenta desactivada.',
    });
  } catch (err) {
    console.error('[admin] cambiarEstado:', err);
    return error(res, 500, 'ERROR_INTERNO', 'Error al cambiar el estado');
  }
};
