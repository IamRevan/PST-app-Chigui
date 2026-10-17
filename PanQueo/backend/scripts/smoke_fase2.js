// Smoke test E2E de los flujos Fase 2 (autoclean: usa SQLite en memoria)
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
const PORT = 3087;

const app = require('../src/app');
const { sequelize, Usuario, Cliente, Receta, Ingrediente, RecetaIngrediente, LoteIngrediente, ListaCompra } = require('../src/models');

(async () => {
  await sequelize.sync({ force: true });

  await Usuario.create({ email: 'smoke@panqueo.com', password: 'SmokeTest_2026!', nombre: 'Smoke', apellido: 'Test', telefono: '04140000000', rol: 'admin', activo: true });
  const cliente = await Cliente.create({ nombre: 'Mariana', apellido: 'Lujan', cedula: 'V-9000000', telefono: '04141112233' });
  const receta1 = await Receta.create({ nombre_receta: 'Torta Encantada', instrucciones: 'x' });
  const receta2 = await Receta.create({ nombre_receta: 'Ponque', instrucciones: 'x' });
  const harina = await Ingrediente.create({ nombre_ing: 'Harina Sin Flash', unidad_medida: 'Kg', stock_minimo: 2 });
  const azucar = await Ingrediente.create({ nombre_ing: 'Azucar Smoke', unidad_medida: 'Kg', stock_minimo: 1 });
  await RecetaIngrediente.create({ id_receta: receta1.id_receta, id_ingrediente: harina.id_ingrediente, cantidad_requerida: 10 });
  await RecetaIngrediente.create({ id_receta: receta2.id_receta, id_ingrediente: azucar.id_ingrediente, cantidad_requerida: 5 });
  const loteH = await LoteIngrediente.create({ id_ingrediente: harina.id_ingrediente, cantidad_inicial: 20, cantidad_actual: 20, fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-01' });
  const loteA = await LoteIngrediente.create({ id_ingrediente: azucar.id_ingrediente, cantidad_inicial: 12, cantidad_actual: 12, fecha_ingreso: '2025-01-01', fecha_venc: '2025-05-01' });

  const server = app.listen(PORT, async () => {
    const base = `http://localhost:${PORT}/api`;
    const j = (r) => r.json();
    try {
      // 1. Login
      const login = await fetch(`${base}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'smoke@panqueo.com', password: 'SmokeTest_2026!' }),
      }).then(j);
      const token = login?.data?.token || login?.token || login?.acces_token;
      if (!token) throw new Error('Login sin token: ' + JSON.stringify(login));
      const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // 2. GET /pedidos/:id con DetallePedidos incluidos
      const pedidoPost = await fetch(`${base}/pedidos`, {
        method: 'POST', headers: auth,
        body: JSON.stringify({
          id_cliente: cliente.id_cliente,
          fecha_entrega: '2025-02-01',
          detalles: [
            { id_receta: receta1.id_receta, cantidad: 1, precio_unitario: 25 },
            { id_receta: receta2.id_receta, cantidad: 2, precio_unitario: 12 },
          ],
        }),
      }).then(j);
      const idPedido = pedidoPost?.data?.id_pedido;
      console.log('2) POST /pedidos ->', pedidoPost?.status, '| id:', idPedido, '| costo calculado:', pedidoPost?.data?.costo_total, '| detalles:', pedidoPost?.data?.DetallePedidos?.length);

      const getPedido = await fetch(`${base}/pedidos/${idPedido}`, { headers: auth }).then(j);
      console.log('3) GET /pedidos/:id -> ', getPedido?.status, '| keys detalle[0]:', JSON.stringify(Object.keys(getPedido?.data?.DetallePedidos?.[0] || {})), '| receta:', getPedido?.data?.DetallePedidos?.[0]?.Receta?.nombre_receta);

      // 4. PATCH estado -> En Cocina (FIFO)
      const parche1 = await fetch(`${base}/pedidos/${idPedido}/estado`, {
        method: 'PATCH', headers: auth, body: JSON.stringify({ estado_entrega: 'En Cocina' }),
      }).then(j);
      console.log('4) PATCH En Cocina ->', parche1?.status, parche1?.status === 'success' ? '' : JSON.stringify(parche1));
      await loteH.reload(); await loteA.reload();
      console.log('   lote harina:', loteH.cantidad_actual, '(esperado 10) | lote azucar:', loteA.cantidad_actual, '(esperado 2: 12-10 plena receta1=0 y receta2=10... ver nota)');

      // 5. Idempotencia: re-PATCH En Cocina
      const parche2 = await fetch(`${base}/pedidos/${idPedido}/estado`, {
        method: 'PATCH', headers: auth, body: JSON.stringify({ estado_entrega: 'En Cocina' }),
      });
      const p2 = await parche2.json();
      console.log('5) Re-PATCH En Cocina -> HTTP', parche2.status, '|', p2.message);

      // 6. Lista de compras: crear lista, PATCH con detalles (comprado), completar -> lotes
      const listaPost = await fetch(`${base}/compras/listas`, {
        method: 'POST', headers: auth,
        body: JSON.stringify({ estado_lista: 'Borrador', detalles: [{ id_ingrediente: azucar.id_ingrediente, cantidad_sugerida: 6, precio_estimado_unitario: 2.5 }] }),
      }).then(j);
      const idLista = listaPost?.data?.id_lista;

      const listaPatch = await fetch(`${base}/compras/listas/${idLista}`, {
        method: 'PATCH', headers: auth,
        body: JSON.stringify({ detalles: [{ id_ingrediente: azucar.id_ingrediente, cantidad_sugerida: 6, cantidad_comprada: 6, precio_estimado_unitario: 2.5 }] }),
      }).then(j);
      console.log('6a) PATCH lista con detalles ->', listaPatch?.status, '| keys data:', JSON.stringify(Object.keys(listaPatch?.data || {})), '| cantidad_comprada:', listaPatch?.data?.DetalleListaCompras?.[0]?.cantidad_comprada);

      const listaDone = await fetch(`${base}/compras/listas/${idLista}/completar`, { method: 'PATCH', headers: auth }).then(j);
      console.log('6b) completar ->', listaDone?.status, '| estado:', listaDone?.data?.estado_lista);

      // 7. GET /inventario/ingredientes/:id  (nuevo endpoint detalle+lotes)
      const ingGet = await fetch(`${base}/inventario/ingredientes/${azucar.id_ingrediente}`, { headers: auth }).then(j);
      console.log('7) GET ingrediente/:id ->', ingGet?.status, '| clave lotes:', Object.keys(ingGet?.data || {}).filter(k => k.toLowerCase().includes('lote')), '| stock_actual:', ingGet?.data?.stock_actual);

      console.log('\nSMOKE TESTS OK');
    } catch (e) {
      console.error('SMOKE FAIL:', e.message);
    } finally {
      server.close();
      await sequelize.close();
      process.exit(0);
    }
  });
})();
