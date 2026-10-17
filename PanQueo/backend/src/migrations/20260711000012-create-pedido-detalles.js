const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('pedido_detalles', {
      id_detalle: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_pedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id_pedido',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_receta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'recetas',
          key: 'id_receta',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cantidad: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 1.0,
        allowNull: false,
      },
      precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('pedido_detalles', ['id_pedido'], {
      name: 'idx_pedido_detalles_pedido',
    });
    await queryInterface.addIndex('pedido_detalles', ['id_receta'], {
      name: 'idx_pedido_detalles_receta',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('pedido_detalles');
  },
};
