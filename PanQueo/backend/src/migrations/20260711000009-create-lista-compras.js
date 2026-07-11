const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_lista_compras_estado AS ENUM ('Borrador', 'En Progreso', 'Completada');
    `);

    await queryInterface.createTable('lista_compras', {
      id_lista: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha_creacion: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      estado_lista: {
        type: 'enum_lista_compras_estado',
        defaultValue: 'Borrador',
        allowNull: false,
      },
      observaciones: {
        type: DataTypes.TEXT,
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

    await queryInterface.addIndex('lista_compras', ['estado_lista'], {
      name: 'idx_lista_compras_estado',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('lista_compras');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_lista_compras_estado;');
  },
};
