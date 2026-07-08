const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecetaIngrediente = sequelize.define('RecetaIngrediente', {
  id_receta_ing: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_receta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recetas', key: 'id_receta' },
  },
  id_ingrediente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ingredientes', key: 'id_ingrediente' },
  },
  cantidad_requerida: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
}, {
  tableName: 'receta_ingredientes',
  underscored: true,
});

module.exports = RecetaIngrediente;
