'use strict';

/**
 * Fase A — Integridad declarativa.
 *
 * Hasta ahora la base solo tenía PK, FK, NOT NULL y UNIQUE. Las reglas de
 * negocio (montos positivos, cantidades coherentes, fechas lógicas) vivían
 * únicamente en el código: cualquier script, importación o consulta manual
 * podía guardar un lote negativo o un abono mayor que el costo.
 *
 * Aquí se trasladan esas reglas a PostgreSQL con CHECK, se añade la FK que
 * faltaba en consumos_lote.id_ingrediente y se garantiza una sola tasa por
 * fecha de valor.
 */

const CHECKS = [
  // usuarios: contador de intentos siempre no negativo
  ['usuarios', 'chk_usuarios_failed_attempts', 'failed_login_attempts >= 0'],

  // clientes: los puntos de fidelidad se acumulan, nunca restan
  ['clientes', 'chk_clientes_puntos_fidelidad', 'puntos_fidelidad >= 0'],

  // ingredientes
  ['ingredientes', 'chk_ingredientes_stock_minimo', 'stock_minimo >= 0'],

  // recetas
  ['receta_ingredientes', 'chk_receta_ing_cantidad', 'cantidad_requerida > 0'],

  // lotes: una existencia no puede ser negativa ni superar lo que ingresó
  ['lotes_ingredientes', 'chk_lotes_cantidad_actual', 'cantidad_actual >= 0'],
  ['lotes_ingredientes', 'chk_lotes_cantidad_inicial', 'cantidad_inicial > 0'],
  ['lotes_ingredientes', 'chk_lotes_consumo_coherente', 'cantidad_actual <= cantidad_inicial'],
  ['lotes_ingredientes', 'chk_lotes_fechas', 'fecha_venc >= fecha_ingreso'],

  // pedidos: dinero y fechas
  ['pedidos', 'chk_pedidos_costo', 'costo_total >= 0'],
  ['pedidos', 'chk_pedidos_abono', 'monto_abonado >= 0'],
  ['pedidos', 'chk_pedidos_abono_max', 'monto_abonado <= costo_total'],
  ['pedidos', 'chk_pedidos_fechas', 'fecha_entrega >= fecha_pedido'],

  // pedido_detalles
  ['pedido_detalles', 'chk_pedido_detalle_cantidad', 'cantidad > 0'],
  ['pedido_detalles', 'chk_pedido_detalle_precio', 'precio_unitario >= 0'],

  // detalle_lista_compras
  ['detalle_lista_compras', 'chk_detalle_lista_sugerida', 'cantidad_sugerida > 0'],
  ['detalle_lista_compras', 'chk_detalle_lista_comprada', 'cantidad_comprada >= 0'],
  ['detalle_lista_compras', 'chk_detalle_lista_precio', 'precio_estimado_unitario >= 0'],

  // tasas BCV: una tasa de cambio no puede ser cero ni negativa
  ['historial_tasa_cambio', 'chk_tasa_usd', 'valor_bs_por_usd > 0'],
  ['historial_tasa_cambio', 'chk_tasa_eur', 'valor_bs_por_eur > 0'],

  // consumos FIFO
  ['consumos_lote', 'chk_consumos_cantidad', 'cantidad_consumida > 0'],

  // sesiones y tokens: la vigencia debe ser posterior a la creación
  ['sesiones', 'chk_sesiones_vigencia', 'expira_at > creada_at'],
  ['tokens_auth', 'chk_tokens_vigencia', 'expira_at > created_at'],
];

const agregarCheck = (queryInterface, tabla, nombre, expresion) => queryInterface.sequelize.query(
  `ALTER TABLE "${tabla}" ADD CONSTRAINT "${nombre}" CHECK (${expresion});`
);

const quitarCheck = (queryInterface, tabla, nombre) => queryInterface.sequelize.query(
  `ALTER TABLE "${tabla}" DROP CONSTRAINT IF EXISTS "${nombre}";`
);

module.exports = {
  up: async (queryInterface) => {
    // FK que faltaba: un consumo no puede apuntar a un ingrediente inexistente.
    await queryInterface.addConstraint('consumos_lote', {
      fields: ['id_ingrediente'],
      type: 'foreign key',
      name: 'consumos_lote_id_ingrediente_fkey',
      references: { table: 'ingredientes', field: 'id_ingrediente' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    for (const [tabla, nombre, expresion] of CHECKS) {
      await agregarCheck(queryInterface, tabla, nombre, expresion);
    }

    // Una sola tasa por fecha de valor. Índice parcial porque las filas
    // históricas anteriores al sincronizador aún pueden no tener fecha_valor.
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_tasa_fecha_valor";'
    );
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "uq_tasa_fecha_valor" ON "historial_tasa_cambio" ("fecha_valor") WHERE "fecha_valor" IS NOT NULL;'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "uq_tasa_fecha_valor";');
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_tasa_fecha_valor" ON "historial_tasa_cambio" ("fecha_valor");'
    );

    for (const [tabla, nombre] of CHECKS) {
      await quitarCheck(queryInterface, tabla, nombre);
    }

    await queryInterface.removeConstraint(
      'consumos_lote',
      'consumos_lote_id_ingrediente_fkey'
    );
  },
};
