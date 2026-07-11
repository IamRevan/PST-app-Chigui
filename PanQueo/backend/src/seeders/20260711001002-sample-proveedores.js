module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('proveedores', [
      {
        nombre: 'Distribuidora Central C.A.',
        contacto: 'Carlos Mendoza',
        telefono: '+58 212 555 0101',
        direccion: 'Av. Principal, Zona Industrial, Caracas',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'Productos La Pastora',
        contacto: 'María Fernández',
        telefono: '+58 241 555 0202',
        direccion: 'Calle 5, Valencia, Edo. Carabobo',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'Importadora Los Andes',
        contacto: 'José Rivas',
        telefono: '+58 274 555 0303',
        direccion: 'Av. Bolívar, Mérida',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('proveedores', null, {});
  },
};
