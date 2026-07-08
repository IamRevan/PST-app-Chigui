const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'clientes', key: 'id_cliente' },
  },
  id_receta: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'recetas', key: 'id_receta' },
  },
  fecha_pedido: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  fecha_entrega: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  costo_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  monto_abonado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  estado_pago: {
    type: DataTypes.ENUM('Pendiente', 'Abonado', 'Pagado'),
    allowNull: false,
    defaultValue: 'Pendiente',
  },
  estado_entrega: {
    type: DataTypes.ENUM('Por Preparar', 'En Cocina', 'Listo', 'Entregado'),
    allowNull: false,
    defaultValue: 'Por Preparar',
  },
  es_delivery: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  direccion_delivery: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'pedidos',
  underscored: true,
});

module.exports = Pedido;
