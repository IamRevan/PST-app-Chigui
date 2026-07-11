module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('recetas', [
      {
        nombre_receta: 'Pastel de Tres Leches',
        instrucciones: '1. Batir claras a punto de nieve. 2. Mezclar yemas con azúcar. 3. Incorporar harina tamizada. 4. Hornear a 180°C por 35 min. 5. Bañar con mezcla de tres leches. 6. Refrigerar por 4 horas.',
        rendimiento: '1 pastel (12 porciones)',
        precio_sugerido: 25.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_receta: 'Galletas de Chocolate',
        instrucciones: '1. Batir mantequilla con azúcar. 2. Agregar huevo y vainilla. 3. Incorporar harina y chocolate. 4. Formar bolitas y hornear 15 min a 180°C.',
        rendimiento: '24 galletas',
        precio_sugerido: 8.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_receta: 'Pan de Mantequilla',
        instrucciones: '1. Disolver levadura en leche tibia. 2. Mezclar harina, mantequilla, huevo. 3. Amasar 10 min. 4. Dejar reposar 1 hora. 5. Hornear 25 min a 190°C.',
        rendimiento: '2 panes grandes',
        precio_sugerido: 6.00,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('recetas', null, {});
  },
};
