module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('receta_ingredientes', [
      // Pastel de Tres Leches (id_receta = 1)
      { id_receta: 1, id_ingrediente: 1, cantidad_requerida: 0.50, created_at: new Date(), updated_at: new Date() }, // Harina
      { id_receta: 1, id_ingrediente: 2, cantidad_requerida: 0.40, created_at: new Date(), updated_at: new Date() }, // Azúcar
      { id_receta: 1, id_ingrediente: 3, cantidad_requerida: 0.75, created_at: new Date(), updated_at: new Date() }, // Leche
      { id_receta: 1, id_ingrediente: 5, cantidad_requerida: 4.00, created_at: new Date(), updated_at: new Date() }, // Huevos
      { id_receta: 1, id_ingrediente: 7, cantidad_requerida: 0.01, created_at: new Date(), updated_at: new Date() }, // Vainilla

      // Galletas de Chocolate (id_receta = 2)
      { id_receta: 2, id_ingrediente: 1, cantidad_requerida: 0.30, created_at: new Date(), updated_at: new Date() }, // Harina
      { id_receta: 2, id_ingrediente: 2, cantidad_requerida: 0.20, created_at: new Date(), updated_at: new Date() }, // Azúcar
      { id_receta: 2, id_ingrediente: 4, cantidad_requerida: 0.15, created_at: new Date(), updated_at: new Date() }, // Mantequilla
      { id_receta: 2, id_ingrediente: 5, cantidad_requerida: 1.00, created_at: new Date(), updated_at: new Date() }, // Huevo
      { id_receta: 2, id_ingrediente: 6, cantidad_requerida: 0.20, created_at: new Date(), updated_at: new Date() }, // Chocolate

      // Pan de Mantequilla (id_receta = 3)
      { id_receta: 3, id_ingrediente: 1, cantidad_requerida: 0.50, created_at: new Date(), updated_at: new Date() }, // Harina
      { id_receta: 3, id_ingrediente: 2, cantidad_requerida: 0.05, created_at: new Date(), updated_at: new Date() }, // Azúcar
      { id_receta: 3, id_ingrediente: 3, cantidad_requerida: 0.20, created_at: new Date(), updated_at: new Date() }, // Leche
      { id_receta: 3, id_ingrediente: 4, cantidad_requerida: 0.10, created_at: new Date(), updated_at: new Date() }, // Mantequilla
      { id_receta: 3, id_ingrediente: 5, cantidad_requerida: 1.00, created_at: new Date(), updated_at: new Date() }, // Huevo
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('receta_ingredientes', null, {});
  },
};
