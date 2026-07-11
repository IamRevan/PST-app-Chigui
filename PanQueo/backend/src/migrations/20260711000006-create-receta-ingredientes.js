const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('receta_ingredientes', {
      id_receta_ing: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_receta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'recetas',
          key: 'id_receta',
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
      cantidad_requerida: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
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

    await queryInterface.addIndex('receta_ingredientes', ['id_receta'], {
      name: 'idx_receta_ing_receta',
    });
    await queryInterface.addIndex('receta_ingredientes', ['id_ingrediente'], {
      name: 'idx_receta_ing_ingrediente',
    });
    await queryInterface.addIndex('receta_ingredientes', ['id_receta', 'id_ingrediente'], {
      name: 'idx_receta_ing_compuesto',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('receta_ingredientes');
  },
};
