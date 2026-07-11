const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Admin',
        apellido: 'PanQueo',
        email: 'admin@panqueo.com',
        telefono: '+58 412 000 0000',
        password: hashedPassword,
        rol: 'admin',
        activo: true,
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
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('usuarios', null, {});
  },
};
