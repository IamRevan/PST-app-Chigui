module.exports = {
  up: async (queryInterface) => {
    const today = new Date();
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    await queryInterface.bulkInsert('historial_tasa_cambio', [
      {
        fecha_registro: addDays(today, -7),
        valor_bs_por_usd: 36.50,
        fuente_referencia: 'BCV',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        fecha_registro: addDays(today, -2),
        valor_bs_por_usd: 38.20,
        fuente_referencia: 'BCV',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        fecha_registro: today,
        valor_bs_por_usd: 40.00,
        fuente_referencia: 'BCV',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('historial_tasa_cambio', null, {});
  },
};
