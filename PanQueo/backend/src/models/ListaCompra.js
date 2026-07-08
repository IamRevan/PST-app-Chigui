const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ListaCompra = sequelize.define('ListaCompra', {
  id_lista: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha_creacion: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  estado_lista: {
    type: DataTypes.ENUM('Borrador', 'En Progreso', 'Completada'),
    defaultValue: 'Borrador',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'lista_compras',
  underscored: true,
});

module.exports = ListaCompra;
