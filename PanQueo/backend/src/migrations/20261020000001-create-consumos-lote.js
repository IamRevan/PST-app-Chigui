const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('consumos_lote', {
      id_consumo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_pedido: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'pedidos',
          key: 'id_pedido',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_lote: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'lotes_ingredientes',
          key: 'id_lote',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_ingrediente: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidad_consumida: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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

    await queryInterface.addIndex('consumos_lote', ['id_ingrediente'], {
      name: 'idx_consumos_ingrediente',
    });
    await queryInterface.addIndex('consumos_lote', ['id_pedido'], {
      name: 'idx_consumos_pedido',
    });
    await queryInterface.addIndex('consumos_lote', ['id_lote'], {
      name: 'idx_consumos_lote',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('consumos_lote');
  },
};
