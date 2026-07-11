const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_lotes_moneda AS ENUM ('Bs', 'USD');
    `);

    await queryInterface.createTable('lotes_ingredientes', {
      id_lote: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_ingrediente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ingredientes',
          key: 'id_ingrediente',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cantidad_actual: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      cantidad_inicial: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fecha_ingreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_venc: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      precio_compra_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      moneda: {
        type: 'enum_lotes_moneda',
        defaultValue: 'Bs',
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

    await queryInterface.addIndex('lotes_ingredientes', ['id_ingrediente'], {
      name: 'idx_lotes_ingrediente',
    });
    await queryInterface.addIndex('lotes_ingredientes', ['fecha_venc'], {
      name: 'idx_lotes_fecha_venc',
    });
    await queryInterface.addIndex('lotes_ingredientes', ['id_ingrediente', 'fecha_venc'], {
      name: 'idx_lotes_fifo',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('lotes_ingredientes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_lotes_moneda;');
  },
};
