const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_pedidos_estado_pago AS ENUM ('Pendiente', 'Abonado', 'Pagado');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_pedidos_estado_entrega AS ENUM ('Por Preparar', 'En Cocina', 'Listo', 'Entregado');
    `);

    await queryInterface.createTable('pedidos', {
      id_pedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id_cliente',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      id_receta: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'recetas',
          key: 'id_receta',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      fecha_pedido: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      fecha_entrega: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      costo_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      monto_abonado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      estado_pago: {
        type: 'enum_pedidos_estado_pago',
        defaultValue: 'Pendiente',
        allowNull: false,
      },
      estado_entrega: {
        type: 'enum_pedidos_estado_entrega',
        defaultValue: 'Por Preparar',
        allowNull: false,
      },
      es_delivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      direccion_delivery: {
        type: DataTypes.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('pedidos', ['id_cliente'], {
      name: 'idx_pedidos_cliente',
    });
    await queryInterface.addIndex('pedidos', ['id_receta'], {
      name: 'idx_pedidos_receta',
    });
    await queryInterface.addIndex('pedidos', ['estado_pago'], {
      name: 'idx_pedidos_estado_pago',
    });
    await queryInterface.addIndex('pedidos', ['estado_entrega'], {
      name: 'idx_pedidos_estado_entrega',
    });
    await queryInterface.addIndex('pedidos', ['fecha_pedido'], {
      name: 'idx_pedidos_fecha',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('pedidos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_pedidos_estado_pago;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_pedidos_estado_entrega;');
  },
};
