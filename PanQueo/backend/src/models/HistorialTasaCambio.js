const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialTasaCambio = sequelize.define('HistorialTasaCambio', {
  id_tasa: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha_registro: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  valor_bs_por_usd: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
  },
  fuente_referencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'historial_tasa_cambio',
  underscored: true,
  timestamps: false,
});

module.exports = HistorialTasaCambio;
