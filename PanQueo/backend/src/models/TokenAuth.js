const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TokenAuth = sequelize.define('TokenAuth', {
  id_token: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  token_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  expira_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usado_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'tokens_auth',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

TokenAuth.prototype.estaVigente = function (ahora = new Date()) {
  return !this.usado_at && new Date(this.expira_at) > ahora;
};

module.exports = TokenAuth;
