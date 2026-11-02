const bcrypt = require('bcryptjs');

/**
 * Usuarios iniciales de desarrollo.
 *
 * La contraseña se toma de ADMIN_PASSWORD. En producción el seeder se niega a
 * ejecutarse sin ella para no dejar cuentas con credenciales conocidas.
 * El costo de bcrypt es 12, igual que en el modelo Usuario.
 */
const BCRYPT_ROUNDS = 12;

const PASSWORD_POR_DEFECTO = 'admin123';

const obtenerPassword = () => {
  const desdeEntorno = String(process.env.ADMIN_PASSWORD || '').trim();

  if (process.env.NODE_ENV === 'production' && !desdeEntorno) {
    throw new Error(
      'Define ADMIN_PASSWORD antes de sembrar usuarios en producción (las cuentas iniciales no pueden usar la contraseña por defecto).'
    );
  }

  if (!desdeEntorno) {
    console.warn('[seed] Usando contraseña por defecto "admin123"; cámbiala al iniciar sesión.');
  }

  return desdeEntorno || PASSWORD_POR_DEFECTO;
};

module.exports = {
  up: async (queryInterface) => {
    const hashedPassword = await bcrypt.hash(obtenerPassword(), BCRYPT_ROUNDS);
    const ahora = new Date();

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Admin',
        apellido: 'PanQueo',
        email: 'admin@panqueo.com',
        telefono: '+58 412 000 0000',
        password: hashedPassword,
        rol: 'admin',
        activo: true,
        email_verificado_at: ahora,
        password_changed_at: ahora,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'Cocinero',
        apellido: 'Sprinkle',
        email: 'cocinero@panqueo.com',
        telefono: '+58 412 000 0001',
        password: hashedPassword,
        rol: 'cocinero',
        activo: true,
        email_verificado_at: ahora,
        password_changed_at: ahora,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'Vendedor',
        apellido: 'Capibara',
        email: 'vendedor@panqueo.com',
        telefono: '+58 412 000 0002',
        password: hashedPassword,
        rol: 'vendedor',
        activo: true,
        email_verificado_at: ahora,
        password_changed_at: ahora,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('usuarios', null, {});
  },
};
