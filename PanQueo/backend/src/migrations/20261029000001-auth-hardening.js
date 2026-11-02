const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // --- Campos de seguridad en usuarios ---
    await queryInterface.addColumn('usuarios', 'email_verificado_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'password_changed_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'failed_login_attempts', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('usuarios', 'locked_until', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'mfa_enabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('usuarios', 'mfa_secret', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'mfa_pending_secret', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'mfa_recovery_codes', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'mfa_last_step', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });

    // Los usuarios existentes ya operaban con su correo; se consideran verificados.
    await queryInterface.sequelize.query(
      'UPDATE usuarios SET email_verificado_at = NOW() WHERE email_verificado_at IS NULL;'
    );

    // --- Sesiones revocables en servidor ---
    await queryInterface.createTable('sesiones', {
      id_sesion: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onDelete: 'CASCADE',
      },
      csrf_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      creada_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expira_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      ultima_actividad_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revocada_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      motivo_revocacion: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    });

    await queryInterface.addIndex('sesiones', ['id_usuario', 'revocada_at'], {
      name: 'idx_sesiones_usuario_activa',
    });
    await queryInterface.addIndex('sesiones', ['expira_at'], {
      name: 'idx_sesiones_expira',
    });

    // --- Tokens de un solo uso (verificación de correo / recuperación) ---
    await queryInterface.createTable('tokens_auth', {
      id_token: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' },
        onDelete: 'CASCADE',
      },
      tipo: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      token_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      expira_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      usado_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('tokens_auth', ['id_usuario', 'tipo'], {
      name: 'idx_tokens_auth_usuario_tipo',
    });

    // --- Bitácora de eventos de autenticación (monitoreo) ---
    await queryInterface.createTable('auth_eventos', {
      id_evento: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id_usuario' },
        onDelete: 'SET NULL',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tipo: {
        type: DataTypes.STRING(48),
        allowNull: false,
      },
      exito: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      ip: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      detalle: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('auth_eventos', ['id_usuario', 'created_at'], {
      name: 'idx_auth_eventos_usuario_fecha',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('auth_eventos');
    await queryInterface.dropTable('tokens_auth');
    await queryInterface.dropTable('sesiones');

    await queryInterface.removeColumn('usuarios', 'mfa_last_step');
    await queryInterface.removeColumn('usuarios', 'mfa_recovery_codes');
    await queryInterface.removeColumn('usuarios', 'mfa_pending_secret');
    await queryInterface.removeColumn('usuarios', 'mfa_secret');
    await queryInterface.removeColumn('usuarios', 'mfa_enabled');
    await queryInterface.removeColumn('usuarios', 'locked_until');
    await queryInterface.removeColumn('usuarios', 'failed_login_attempts');
    await queryInterface.removeColumn('usuarios', 'password_changed_at');
    await queryInterface.removeColumn('usuarios', 'email_verificado_at');
  },
};
