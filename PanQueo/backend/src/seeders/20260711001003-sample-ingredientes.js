module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('ingredientes', [
      {
        nombre_ing: 'Harina de Trigo 0000',
        stock_minimo: 10.00,
        unidad_medida: 'kg',
        id_proveedor: 1,
        categoria: 'Harinas',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Azúcar Refinada',
        stock_minimo: 15.00,
        unidad_medida: 'kg',
        id_proveedor: 1,
        categoria: 'Endulzantes',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Leche Entera',
        stock_minimo: 10.00,
        unidad_medida: 'L',
        id_proveedor: 2,
        categoria: 'Lácteos',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Mantequilla sin Sal',
        stock_minimo: 5.00,
        unidad_medida: 'kg',
        id_proveedor: 2,
        categoria: 'Lácteos',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Huevos de Campo',
        stock_minimo: 50.00,
        unidad_medida: 'unidades',
        id_proveedor: 2,
        categoria: 'Huevos',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Chocolate Oscuro 70%',
        stock_minimo: 3.00,
        unidad_medida: 'kg',
        id_proveedor: 3,
        categoria: 'Chocolates',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Esencia de Vainilla',
        stock_minimo: 1.00,
        unidad_medida: 'L',
        id_proveedor: 3,
        categoria: 'Esencias',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre_ing: 'Polvo de Hornear',
        stock_minimo: 2.00,
        unidad_medida: 'kg',
        id_proveedor: 1,
        categoria: 'Levaduras',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('ingredientes', null, {});
  },
};
