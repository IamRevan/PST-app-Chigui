'use strict';

/**
 * Añade el rol "desarrollador" al enum de usuarios.
 *
 * PostgreSQL no permite quitar valores de un enum de forma sencilla, así que el
 * `down` es un no-op: el valor simplemente deja de usarse si se revierte.
 */

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_usuarios_rol" ADD VALUE IF NOT EXISTS 'desarrollador';`
    );
  },

  down: async () => {
    // No-op intencional: ALTER TYPE no soporta DROP VALUE de forma segura aquí.
  },
};
