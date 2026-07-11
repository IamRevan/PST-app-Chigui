const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('detalle_lista_compras', {
      id_detalle_lista: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_lista: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'lista_compras',
          key: 'id_lista',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_ingrediente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ingredientes',
          key: 'id_ingrediente',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cantidad_sugerida: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      cantidad_comprada: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      precio_estimado_unitario: {
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

    await queryInterface.addIndex('detalle_lista_compras', ['id_lista'], {
      name: 'idx_detalle_lista',
    });
    await queryInterface.addIndex('detalle_lista_compras', ['id_ingrediente'], {
      name: 'idx_detalle_ingrediente',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('detalle_lista_compras');
  },
};
