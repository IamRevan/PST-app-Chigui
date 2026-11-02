const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('historial_tasa_cambio', 'valor_bs_por_eur', {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: true,
      after: 'valor_bs_por_usd',
    });

    await queryInterface.addColumn('historial_tasa_cambio', 'fecha_valor', {
      type: DataTypes.DATEONLY,
      allowNull: true,
      after: 'fecha_registro',
    });

    await queryInterface.addColumn('historial_tasa_cambio', 'sincronizado_en', {
      type: DataTypes.DATE,
      allowNull: true,
      after: 'fuente_referencia',
    });

    await queryInterface.addIndex('historial_tasa_cambio', ['fecha_valor'], {
      name: 'idx_tasa_fecha_valor',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('historial_tasa_cambio', 'idx_tasa_fecha_valor');
    await queryInterface.removeColumn('historial_tasa_cambio', 'sincronizado_en');
    await queryInterface.removeColumn('historial_tasa_cambio', 'fecha_valor');
    await queryInterface.removeColumn('historial_tasa_cambio', 'valor_bs_por_eur');
  },
};
