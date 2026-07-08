const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleListaCompra = sequelize.define('DetalleListaCompra', {
  id_detalle_lista: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_lista: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'lista_compras', key: 'id_lista' },
  },
  id_ingrediente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'ingredientes', key: 'id_ingrediente' },
  },
  cantidad_sugerida: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cantidad_comprada: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  precio_estimado_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'detalle_lista_compras',
  underscored: true,
});

module.exports = DetalleListaCompra;
