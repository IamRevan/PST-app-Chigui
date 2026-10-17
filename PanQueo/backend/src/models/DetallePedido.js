const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetallePedido = sequelize.define('DetallePedido', {
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'pedidos', key: 'id_pedido' },
  },
  id_receta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recetas', key: 'id_receta' },
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'pedido_detalles',
  underscored: true,
});

module.exports = DetallePedido;
