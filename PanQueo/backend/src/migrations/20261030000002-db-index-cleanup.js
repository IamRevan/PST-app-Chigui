'use strict';

/**
 * Fase D — Índices según consultas reales.
 *
 * Se eliminan cinco índices que ya cubre otra restricción o el prefijo de un
 * índice compuesto: cada uno cuesta escritura en INSERT/UPDATE sin aportar
 * nada al planificador. A cambio se añaden tres que sí corresponden a
 * consultas que hace la API (listados ordenados sin filtro por PK).
 *
 * También se eliminan dos tipos ENUM huérfanos que creó `sequelize.sync` con
 * un nombre distinto al que usan realmente las columnas.
 */

const INDICES_REDUNDANTES = [
  ['usuarios', 'idx_usuarios_email'],
  ['clientes', 'idx_clientes_cedula'],
  ['recetas', 'idx_recetas_nombre'],
  ['ingredientes', 'idx_ingredientes_nombre'],
  ['lotes_ingredientes', 'idx_lotes_ingrediente'],
];

const INDICES_NUEVOS = [
  // ProveedorController.listar -> ORDER BY nombre
  { tabla: 'proveedores', campos: ['nombre'], nombre: 'idx_proveedores_nombre' },
  // ReporteController.consumos -> ORDER BY created_at DESC, id_consumo DESC
  { tabla: 'consumos_lote', campos: ['created_at'], nombre: 'idx_consumos_created_at' },
  // ReporteController.entregas -> ORDER BY fecha_entrega
  { tabla: 'pedidos', campos: ['fecha_entrega'], nombre: 'idx_pedidos_fecha_entrega' },
];

const TIPOS_HUERFANOS = [
  'enum_lotes_ingredientes_moneda',
  'enum_lista_compras_estado_lista',
];

module.exports = {
  up: async (queryInterface) => {
    for (const [tabla, indice] of INDICES_REDUNDANTES) {
      await queryInterface.removeIndex(tabla, indice);
    }

    for (const { tabla, campos, nombre } of INDICES_NUEVOS) {
      await queryInterface.addIndex(tabla, campos, { name: nombre });
    }

    for (const tipo of TIPOS_HUERFANOS) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${tipo}";`);
    }
  },

  down: async (queryInterface) => {
    for (const tipo of TIPOS_HUERFANOS) {
      const etiquetas = tipo.includes('moneda') ? ['Bs', 'USD'] : ['Borrador', 'En Progreso', 'Completada'];
      const valores = etiquetas.map((etiqueta) => `'${etiqueta}'`).join(', ');
      await queryInterface.sequelize.query(
        `DO $$ BEGIN CREATE TYPE "${tipo}" AS ENUM (${valores}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
      );
    }

    for (const { tabla, nombre } of INDICES_NUEVOS) {
      await queryInterface.removeIndex(tabla, nombre);
    }

    // Se restauran con su definición original (dos eran UNIQUE).
    await queryInterface.addIndex('usuarios', ['email'], { name: 'idx_usuarios_email' });
    await queryInterface.addIndex('clientes', ['cedula'], { name: 'idx_clientes_cedula', unique: true });
    await queryInterface.addIndex('recetas', ['nombre_receta'], { name: 'idx_recetas_nombre', unique: true });
    await queryInterface.addIndex('ingredientes', ['nombre_ing'], { name: 'idx_ingredientes_nombre' });
    await queryInterface.addIndex('lotes_ingredientes', ['id_ingrediente'], { name: 'idx_lotes_ingrediente' });
  },
};
