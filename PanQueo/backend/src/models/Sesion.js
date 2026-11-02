const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sesion = sequelize.define('Sesion', {
  id_sesion: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  csrf_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  creada_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expira_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  ultima_actividad_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  revocada_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  motivo_revocacion: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'sesiones',
  timestamps: false,
});

Sesion.prototype.estaActiva = function (ahora = new Date()) {
  return !this.revocada_at && new Date(this.expira_at) > ahora;
};

module.exports = Sesion;
