const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Pedido = require('./Pedido');
const Ingrediente = require('./Ingrediente');
const LoteIngrediente = require('./LoteIngrediente');
const Receta = require('./Receta');
const RecetaIngrediente = require('./RecetaIngrediente');
const ListaCompra = require('./ListaCompra');
const DetalleListaCompra = require('./DetalleListaCompra');
const DetallePedido = require('./DetallePedido');
const HistorialTasaCambio = require('./HistorialTasaCambio');
const Usuario = require('./Usuario');
const Proveedor = require('./Proveedor');
const ConsumoLote = require('./ConsumoLote');

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

Pedido.hasMany(DetallePedido, { foreignKey: 'id_pedido', onDelete: 'CASCADE' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });

Receta.hasMany(DetallePedido, { foreignKey: 'id_receta', onDelete: 'RESTRICT', as: 'Receta' });
DetallePedido.belongsTo(Receta, { foreignKey: 'id_receta', as: 'Receta' });

Ingrediente.hasMany(DetalleListaCompra, { foreignKey: 'id_ingrediente', onDelete: 'RESTRICT' });
DetalleListaCompra.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });

// Trazabilidad FEFO: log de descuentos FIFO por pedido
LoteIngrediente.hasMany(ConsumoLote, { foreignKey: 'id_lote', onDelete: 'CASCADE' });
ConsumoLote.belongsTo(LoteIngrediente, { foreignKey: 'id_lote' });
ConsumoLote.belongsTo(Ingrediente, { foreignKey: 'id_ingrediente' });
Pedido.hasMany(ConsumoLote, { foreignKey: 'id_pedido' });
ConsumoLote.belongsTo(Pedido, { foreignKey: 'id_pedido' });

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
  DetallePedido,
  HistorialTasaCambio,
  Proveedor,
  ConsumoLote,
};
