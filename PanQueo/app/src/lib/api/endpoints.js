export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  RESET_PASSWORD: '/api/auth/reset-password',

  // Clients
  CLIENTES: '/api/clientes',
  CLIENTE_BY_ID: (id) => `/api/clientes/${id}`,
  CLIENTE_HISTORIAL: (id) => `/api/clientes/${id}/historial`,

  // Orders
  PEDIDOS: '/api/pedidos',
  PEDIDO_BY_ID: (id) => `/api/pedidos/${id}`,
  PEDIDO_ESTADO: (id) => `/api/pedidos/${id}/estado`,

  // Inventory
  INVENTARIO: '/api/inventario/ingredientes',
  INVENTARIO_BY_ID: (id) => `/api/inventario/ingredientes/${id}`,
  INVENTARIO_ALERTAS: '/api/inventario/alertas',
  LOTES: '/api/inventario/lotes',
  AJUSTE_INVENTARIO: '/api/inventario/ajuste',

  // Proveedores
  PROVEEDORES: '/api/proveedores',

  // Reportes
  REPORTES_PRODUCCION: '/api/reportes/produccion',
  REPORTES_MERMAS: '/api/reportes/mermas',
  REPORTES_BALANCE: '/api/reportes/balance-pedidos',

  // Anomalias
  ANOMALIAS: '/api/asistente/anomalias',

  // Recipes
  RECETAS: '/api/recetas',
  RECETA_BY_ID: (id) => `/api/recetas/${id}`,

  // Shopping Lists
  LISTAS_COMPRAS: '/api/compras/listas',
  LISTA_COMPRA_BY_ID: (id) => `/api/compras/listas/${id}`,

  // Exchange Rates
  TASAS_ACTUAL: '/api/finanzas/tasas/actual',
  TASAS: '/api/finanzas/tasas',

  // Assistant
  PREDICCION_COMPRA: '/api/asistente/prediccion-compra',
  SUGERENCIAS_PRECIOS: '/api/asistente/sugerencias-precios',
};
