module.exports = {
  up: async (queryInterface) => {
    const today = new Date();
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    await queryInterface.bulkInsert('pedidos', [
      {
        id_cliente: 1,
        id_receta: 1,
        fecha_pedido: addDays(today, -2),
        fecha_entrega: addDays(today, 1),
        costo_total: 25.00,
        monto_abonado: 10.00,
        estado_pago: 'Abonado',
        estado_entrega: 'En Cocina',
        es_delivery: false,
        observaciones: 'Sin chantilly',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_cliente: 2,
        id_receta: 2,
        fecha_pedido: addDays(today, -1),
        fecha_entrega: today,
        costo_total: 8.00,
        monto_abonado: 8.00,
        estado_pago: 'Pagado',
        estado_entrega: 'Listo',
        es_delivery: true,
        direccion_delivery: 'Calle Sucre #45, Los Teques',
        observaciones: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_cliente: 3,
        id_receta: 3,
        fecha_pedido: today,
        fecha_entrega: addDays(today, 3),
        costo_total: 6.00,
        monto_abonado: 0.00,
        estado_pago: 'Pendiente',
        estado_entrega: 'Por Preparar',
        es_delivery: false,
        observaciones: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('pedidos', null, {});
  },
};
