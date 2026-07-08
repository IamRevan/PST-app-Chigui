const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receta = sequelize.define('Receta', {
  id_receta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre_receta: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  instrucciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rendimiento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  precio_sugerido: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'recetas',
  underscored: true,
});

module.exports = Receta;
