const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('historial_tasa_cambio', {
      id_tasa: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha_registro: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      valor_bs_por_usd: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
      },
      fuente_referencia: {
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

    await queryInterface.addIndex('historial_tasa_cambio', ['fecha_registro'], {
      name: 'idx_tasa_fecha',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('historial_tasa_cambio');
  },
};
