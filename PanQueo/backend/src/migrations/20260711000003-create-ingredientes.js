const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('ingredientes', {
      id_ingrediente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_ing: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      stock_minimo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unidad_medida: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'proveedores',
          key: 'id_proveedor',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      categoria: {
        type: DataTypes.STRING,
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

    await queryInterface.addIndex('ingredientes', ['nombre_ing'], {
      name: 'idx_ingredientes_nombre',
    });
    await queryInterface.addIndex('ingredientes', ['id_proveedor'], {
      name: 'idx_ingredientes_proveedor',
    });
    await queryInterface.addIndex('ingredientes', ['categoria'], {
      name: 'idx_ingredientes_categoria',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ingredientes');
  },
};
