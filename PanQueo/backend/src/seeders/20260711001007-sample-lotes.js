module.exports = {
  up: async (queryInterface) => {
    const today = new Date();
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    await queryInterface.bulkInsert('lotes_ingredientes', [
      { id_ingrediente: 1, cantidad_actual: 25.00, cantidad_inicial: 50.00, fecha_ingreso: addDays(today, -30), fecha_venc: addDays(today, 120), precio_compra_unitario: 1.50, moneda: 'Bs', created_at: new Date(), updated_at: new Date() },
      { id_ingrediente: 2, cantidad_actual: 30.00, cantidad_inicial: 40.00, fecha_ingreso: addDays(today, -20), fecha_venc: addDays(today, 180), precio_compra_unitario: 0.90, moneda: 'Bs', created_at: new Date(), updated_at: new Date() },
      { id_ingrediente: 3, cantidad_actual: 15.00, cantidad_inicial: 20.00, fecha_ingreso: addDays(today, -10), fecha_venc: addDays(today, 5), precio_compra_unitario: 2.00, moneda: 'Bs', created_at: new Date(), updated_at: new Date() },
      { id_ingrediente: 4, cantidad_actual: 8.00, cantidad_inicial: 10.00, fecha_ingreso: addDays(today, -15), fecha_venc: addDays(today, 60), precio_compra_unitario: 4.50, moneda: 'Bs', created_at: new Date(), updated_at: new Date() },
      { id_ingrediente: 5, cantidad_actual: 120.00, cantidad_inicial: 200.00, fecha_ingreso: addDays(today, -7), fecha_venc: addDays(today, 20), precio_compra_unitario: 0.25, moneda: 'Bs', created_at: new Date(), updated_at: new Date() },
      { id_ingrediente: 6, cantidad_actual: 5.00, cantidad_inicial: 8.00, fecha_ingreso: addDays(today, -60), fecha_venc: addDays(today, 240), precio_compra_unitario: 8.00, moneda: 'USD', created_at: new Date(), updated_at: new Date() },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('lotes_ingredientes', null, {});
  },
};
