const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ingrediente = sequelize.define('Ingrediente', {
  id_ingrediente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre_ing: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  stock_minimo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'ingredientes',
  underscored: true,
});

module.exports = Ingrediente;
