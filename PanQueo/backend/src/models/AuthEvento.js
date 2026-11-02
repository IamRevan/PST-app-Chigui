const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthEvento = sequelize.define('AuthEvento', {
  id_evento: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tipo: {
    type: DataTypes.STRING(48),
    allowNull: false,
  },
  exito: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  detalle: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'auth_eventos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = AuthEvento;
