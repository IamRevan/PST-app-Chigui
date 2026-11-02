const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'desarrollador', 'cocinero', 'vendedor'),
    // Rol por defecto de mínimo privilegio: el alta de usuarios es pública y
    // un administrador/desarrollador asigna luego los roles elevados.
    defaultValue: 'vendedor',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  email_verificado_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  password_changed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  mfa_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  mfa_secret: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  mfa_pending_secret: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  mfa_recovery_codes: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  mfa_last_step: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      }
    },
  },
});

Usuario.prototype.validarPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

Usuario.prototype.estaBloqueado = function (ahora = new Date()) {
  return Boolean(this.locked_until && new Date(this.locked_until) > ahora);
};

Usuario.prototype.emailVerificado = function () {
  return Boolean(this.email_verificado_at);
};

module.exports = Usuario;
