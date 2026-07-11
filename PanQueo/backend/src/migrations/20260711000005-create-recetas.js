const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('recetas', {
      id_receta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_receta: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      instrucciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rendimiento: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      precio_sugerido: {
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

    await queryInterface.addIndex('recetas', ['nombre_receta'], {
      name: 'idx_recetas_nombre',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('recetas');
  },
};
