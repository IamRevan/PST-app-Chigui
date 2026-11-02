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
  // Tasa oficial del euro publicada por el BCV (Bs por 1 EUR)
  valor_bs_por_eur: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: true,
  },
  // Fecha valor que informa el BCV para la tasa (puede ser el día hábil siguiente)
  fecha_valor: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  fuente_referencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Momento de la última sincronización automática con el BCV
  sincronizado_en: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'historial_tasa_cambio',
  underscored: true,
});

module.exports = HistorialTasaCambio;
