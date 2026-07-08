# PanQueo 🧁

**Sistema de gestión inteligente para repostería** — MVP demo 100% funcional.

Tres aplicaciones en un mismo proyecto. El **MVP** es la web app (`PanQueo/web/`), que funciona sin servidor — solo abre el HTML.

| App | Stack | Estado |
|-----|-------|--------|
| **Web (MVP)** (`PanQueo/web/`) | HTML + CSS + JS vanilla | ✅ MVP completo — sin dependencias, usable al abrir el HTML |
| **Mobile** (`PanQueo/app/`) | React Native (Expo ~57), React Navigation 7 | 26 pantallas, navegación funcional, datos mock (requiere npm install + expo) |
| **Backend** (`PanQueo/backend/`) | Node.js + Express + Sequelize + PostgreSQL | API REST con 10 controladores, 12 modelos, auth JWT |

---

## Web App (MVP) — `PanQueo/web/`

### Cómo iniciar

Abrir `index.html` en cualquier navegador. No requiere servidor ni instalación.

### Funcionalidad

**Auth**
- Splash animado → Login con email y contraseña
- Register con nombre, apellido, email, teléfono
- Restablecer contraseña
- Conexión al backend con fallback offline

**Dashboard**
- KPI cards: Pedidos Hoy, Stock Bajo, Por Cobrar, vs Ayer
- Órdenes activas de producción
- Toggle de moneda (Bs/USD)

**Inventario**
- Lista de insumos con barra de nivel de stock
- Badge de stock crítico con alerta visual
- **Modal Ver Historial** — movimientos (entradas, salidas, ajustes) con resumen de stock
- **Modal Restock / Reponer** — formulario de registro de lote con N° lote, cantidad, fechas, proveedor

**Órdenes**
- Filtros: Todos / Pendientes / En Cocina / Listos / Entregados
- **Modal Ver Detalle** — cliente, estado, total, fecha, productos, tipo de entrega
- Botón "+ Nuevo Pedido" agrega orden mock

**Clientes**
- Lista con búsqueda
- **Modal Perfil de Cliente** — email, dirección, total pedidos, última orden
- **Modal Nuevo Cliente** — formulario con nombre, teléfono, email, dirección

**Perfil**
- Tarjeta de perfil con avatar, nombre, rol, email, teléfono
- **Modal Editar Perfil** — formulario para editar nombre, email, teléfono
- Estadísticas: miembro desde, pedidos gestionados, nivel
- Cerrar sesión

**Notificaciones**
- Modal con lista de notificaciones (stock bajo, lotes por vencer, pedidos completados)
- Accesible desde el ícono 🔔 en el nav

### Sistema de modales

Todos los `alert()` y `prompt()` fueron reemplazados por modales bottom-sheet con animación, que incluyen:
- Formularios con validación (Restock, Nuevo Cliente, Editar Perfil)
- Vistas de detalle (Órdenes, Clientes, Historial)
- Confirmaciones visuales con checkmark

### Archivos

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Estructura completa (splash, auth, main, modal overlay) |
| `css/style.css` | Estilos con tema claro, animaciones, responsive |
| `js/app.js` | Toda la lógica: auth, tabs, modales, renders, mock data |
| `assets/` | Recursos estáticos |

---

## Mobile App — `PanQueo/app/`

### Requisitos

```bash
cd PanQueo/app
npm install
npx expo start
```

### Pantallas (26)

Auth: `SplashScreen`, `LoginScreen`, `RegisterScreen`, `ResetPasswordScreen`
Dashboard: `DashboardScreen`, `ReportesScreen`
Inventario: `InventoryScreen`, `RegistrarLoteScreen`, `AjusteInventarioScreen`, `AlertasVencimientoScreen`, `DetalleProductoScreen`, `ListaComprasScreen`, `HistorialProductoScreen`
Pedidos: `OrdersScreen`, `NuevoPedidoScreen`, `DetallePedidoScreen`
Clientes: `ClientsScreen`, `RegistrarClienteScreen`, `HistorialClienteScreen`
Recetas: `RecipesScreen`, `NuevaRecetaScreen`
Notificaciones: `NotificacionesScreen`
Perfil: `ProfileScreen`, `ConfiguracionScreen`, `SeguridadScreen`, `AcercaDeScreen`
Success: `PedidoExitosoScreen`, `LoteExitosoScreen`, `RegistroExitosoScreen`

---

## Backend API — `PanQueo/backend/`

### Cómo iniciar

```bash
cd PanQueo/backend
npm install
# Configurar .env (ver .env.example)
npm run migrate
npm run seed
npm start
```

### Endpoints

| Ruta | Módulo |
|------|--------|
| `/api/auth` | Login, register, refresh, logout |
| `/api/inventario` | CRUD ingredientes, ajustes de stock |
| `/api/pedidos` | CRUD pedidos, cambio de estado |
| `/api/recetas` | CRUD recetas con ingredientes |
| `/api/clientes` | CRUD clientes |
| `/api/compras` | Listas de compra |
| `/api/finanzas` | Historial de tasa de cambio, sugerencia de precios (dual: Bs/USD) |
| `/api/asistente` | Chat IA, anomalías, consumo promedio diario |
| `/api/proveedores` | CRUD proveedores |
| `/api/reportes` | Reportes de producción, mermas, balance de pedidos |

### Modelos (12)

`Usuario`, `Cliente`, `Ingrediente`, `LoteIngrediente`, `Receta`, `RecetaIngrediente`, `Pedido`, `ListaCompra`, `DetalleListaCompra`, `Proveedor`, `HistorialTasaCambio`, `AlertasVencimiento`

### Servicios

- `FIFOService` — valoración de inventario FIFO con rollback
- `AsistenteService` — consumo promedio, detección de anomalías, sugerencia de precios dual
- `AlertasService` — alertas de stock y vencimiento

---

## Estructura del proyecto

```
PST-app-Chigui/
├── PanQueo/
│   ├── app/            # React Native (Expo)
│   │   ├── App.js
│   │   ├── src/
│   │   │   ├── auth/          # AuthContext, ProtectedRoute
│   │   │   ├── components/    # ui/ (Button, Input, etc.), navigation/ (BottomTabs, AuthStack, ScreenWrapper)
│   │   │   ├── lib/           # api/, hooks/, theme/, utils/
│   │   │   ├── navigation/    # AppNavigator
│   │   │   └── screens/       # 26 pantallas en 8 subdirectorios
│   │   ├── app.json
│   │   └── package.json
│   ├── backend/        # Node.js + Express + Sequelize
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/   # 10 controladores
│   │   │   ├── middleware/
│   │   │   ├── models/        # 12 modelos
│   │   │   ├── routes/        # 11 archivos de rutas
│   │   │   └── services/      # 3 servicios
│   │   ├── .env
│   │   └── package.json
│   └── web/            # HTML + CSS + JS vanilla
│       ├── index.html
│       ├── css/style.css
│       └── js/app.js
├── Documento de desarrollo Maestro My peaplo Toasty.md
└── README.md
```

---

## Notas para el MVP

- La **app mobile** funciona 100% con datos mock — no requiere backend
- La **web app** tiene conexión al backend con fallback offline
- El **backend** tiene bugs corregidos (transacciones, destructure, placeholders) y módulos completos (Proveedores, Reportes, moneda dual)
- `stitch_sprinkle_prototipo_app/` y `tmp_expo/` están en `.gitignore` (prototipos de diseño AI y proyecto de prueba)
