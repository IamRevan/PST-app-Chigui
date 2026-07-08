const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Pedido = require('./Pedido');
const Ingrediente = require('./Ingrediente');
const LoteIngrediente = require('./LoteIngrediente');
const Receta = require('./Receta');
const RecetaIngrediente = require('./RecetaIngrediente');
const ListaCompra = require('./ListaCompra');
const DetalleListaCompra = require('./DetalleListaCompra');
const HistorialTasaCambio = require('./HistorialTasaCambio');
const Usuario = require('./Usuario');
const Proveedor = require('./Proveedor');

// Relaciones del documento (con ON DELETE del master)
Cliente.hasMany(Pedido, { foreignKey: 'id_cliente', onDelete: 'RESTRICT' });
Pedido.belongsTo(Cliente, { foreignKey: 'id_cliente' });

Receta.hasMany(RecetaIngrediente, { foreignKey: 'id_receta', onDelete: 'CASCADE' });
RecetaIngrediente.belongsTo(Receta, { foreignKey: 'id_receta' });
Pedido.belongsTo(Receta, { foreignKey: 'id_receta' });

Ingrediente.hasMany(RecetaIngrediente, { foreignKey: 'id_ingrediente', onDelete: 'RESTRICT' });
RecetaIngrediente.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });

Ingrediente.hasMany(LoteIngrediente, { foreignKey: 'id_ingrediente', onDelete: 'CASCADE' });
LoteIngrediente.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });

Ingrediente.belongsTo(Proveedor, { foreignKey: 'id_proveedor' });
Proveedor.hasMany(Ingrediente, { foreignKey: 'id_proveedor' });

ListaCompra.hasMany(DetalleListaCompra, { foreignKey: 'id_lista', onDelete: 'CASCADE' });
DetalleListaCompra.belongsTo(ListaCompra, { foreignKey: 'id_lista' });

Ingrediente.hasMany(DetalleListaCompra, { foreignKey: 'id_ingrediente', onDelete: 'RESTRICT' });
DetalleListaCompra.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });

module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Pedido,
  Ingrediente,
  LoteIngrediente,
  Receta,
  RecetaIngrediente,
  ListaCompra,
  DetalleListaCompra,
  HistorialTasaCambio,
  Proveedor,
};
