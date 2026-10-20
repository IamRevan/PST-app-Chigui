const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Log de trazabilidad FEFO: cada descuento FIFO de inventario por pedido
 * queda registrado con el lote, ingrediente, cantidad consumida y fecha.
 */
const ConsumoLote = sequelize.define('ConsumoLote', {
  id_consumo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'pedidos', key: 'id_pedido' },
  },
  id_lote: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'lotes_ingredientes', key: 'id_lote' },
  },
  id_ingrediente: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad_consumida: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
}, {
  tableName: 'consumos_lote',
  underscored: true,
});

module.exports = ConsumoLote;
