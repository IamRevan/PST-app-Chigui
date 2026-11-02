export const ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  RESET_PASSWORD: "/api/auth/reset-password",
  PERFIL: "/api/auth/perfil",

  // Seguridad de la cuenta
  MFA_ESTADO: "/api/auth/mfa/estado",
  MFA_INICIAR: "/api/auth/mfa/iniciar",
  MFA_ACTIVAR: "/api/auth/mfa/activar",
  MFA_DESACTIVAR: "/api/auth/mfa/desactivar",
  CAMBIAR_PASSWORD: "/api/auth/cambiar-password",
  SESIONES: "/api/auth/sesiones",
  SESION_BY_ID: (id) => `/api/auth/sesiones/${id}`,
  EVENTOS: "/api/auth/eventos",
  LOGOUT: "/api/auth/logout",
  LOGOUT_TODOS: "/api/auth/logout-todos",

  // Administración de usuarios (roles y cuentas)
  ADMIN_USUARIOS: "/api/admin/usuarios",
  ADMIN_USUARIO_ROL: (id) => `/api/admin/usuarios/${id}/rol`,
  ADMIN_USUARIO_ESTADO: (id) => `/api/admin/usuarios/${id}/estado`,

  // Clients
  CLIENTES: "/api/clientes",
  CLIENTE_BY_ID: (id) => `/api/clientes/${id}`,
  CLIENTE_HISTORIAL: (id) => `/api/clientes/${id}/historial`,

  // Orders
  PEDIDOS: "/api/pedidos",
  PEDIDO_BY_ID: (id) => `/api/pedidos/${id}`,
  PEDIDO_ESTADO: (id) => `/api/pedidos/${id}/estado`,

  // Inventory
  INVENTARIO: "/api/inventario/ingredientes",
  INVENTARIO_BY_ID: (id) => `/api/inventario/ingredientes/${id}`,
  INVENTARIO_ALERTAS: "/api/inventario/alertas",
  LOTES: "/api/inventario/lotes",
  AJUSTE_INVENTARIO: "/api/inventario/ajuste",

  // Proveedores
  PROVEEDORES: "/api/proveedores",

  // Reportes
  REPORTES_PRODUCCION: "/api/reportes/produccion",
  REPORTES_MERMAS: "/api/reportes/mermas",
  REPORTES_TRAZABILIDAD: "/api/reportes/trazabilidad",
  REPORTES_BALANCE: "/api/reportes/balance-pedidos",

  // Recipes
  RECETAS: "/api/recetas",
  RECETA_BY_ID: (id) => `/api/recetas/${id}`,
  RECETA_SIMULAR_COSTO: (id) => `/api/recetas/${id}/simular-costo`,
  RECETA_VERIFICAR_STOCK: (id) => `/api/recetas/${id}/verificar-stock`,

  // Shopping Lists
  LISTAS_COMPRAS: "/api/compras/listas",
  LISTA_COMPRA_BY_ID: (id) => `/api/compras/listas/${id}`,
  LISTA_COMPRA_COMPLETAR: (id) => `/api/compras/listas/${id}/completar`,

  // Exchange Rates
  TASAS_ACTUAL: "/api/finanzas/tasas/actual",
  TASAS_SINCRONIZAR: "/api/finanzas/tasas/sincronizar",
  TASAS: "/api/finanzas/tasas",

  // Assistant
  PREDICCION_COMPRA: "/api/asistente/prediccion-compra",
  SUGERENCIAS_PRECIOS: "/api/asistente/sugerencias-precios",
  ANOMALIAS: "/api/asistente/anomalias",

  // Health check
  HEALTH: "/api/health",
};
