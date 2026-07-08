const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoteIngrediente = sequelize.define('LoteIngrediente', {
  id_lote: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_ingrediente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ingredientes', key: 'id_ingrediente' },
  },
  cantidad_actual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  cantidad_inicial: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_ingreso: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
    },
  },
  fecha_venc: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      despuesDeIngreso(value) {
        if (new Date(value) < new Date(this.fecha_ingreso)) {
          throw new Error('fecha_venc debe ser posterior a fecha_ingreso');
        }
      },
    },
  },
  precio_compra_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  moneda: {
    type: DataTypes.ENUM('Bs', 'USD'),
    defaultValue: 'Bs',
  },
}, {
  tableName: 'lotes_ingredientes',
  underscored: true,
});

module.exports = LoteIngrediente;
