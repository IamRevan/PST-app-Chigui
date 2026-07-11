module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('clientes', [
      {
        nombre: 'María',
        apellido: 'García',
        cedula: 'V12345678',
        telefono: '+58 412 123 4567',
        direccion: 'Av. Principal, Edif. 5, Caracas',
        puntos_fidelidad: 120,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: 'V23456789',
        telefono: '+58 414 765 4321',
        direccion: 'Calle Sucre #45, Los Teques',
        puntos_fidelidad: 45,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre: 'Ana',
        apellido: 'Martínez',
        cedula: 'V34567890',
        telefono: '+58 426 998 8776',
        direccion: 'Urb. Las Flores, Casa 12, Caracas',
        puntos_fidelidad: 280,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('clientes', null, {});
  },
};
