# PanQueo 🧁

**Sistema de gestión inteligente para repostería** — dual-dialecto: SQLite en desarrollo, PostgreSQL en producción.

Tres aplicaciones en un mismo proyecto:

| App | Stack | Estado |
|-----|-------|--------|
| **Web** (`PanQueo/web/`) | HTML + CSS + JS vanilla + Backend real | ✅ Fases 1–3.4 completas — shell escritorio, dark mode, bimoneda BCV, inventario FIFO real |
| **Mobile** (`PanQueo/app/`) | React Native (Expo ~57), React Navigation 7 | 26 pantallas, navegación funcional, datos mock (requiere npm install + expo) |
| **Backend** (`PanQueo/backend/`) | Node.js + Express + Sequelize | API REST con 10 controladores, 13 modelos, auth JWT, 91/91 tests |

---

## Web App — `PanQueo/web/`

### Cómo iniciar

```bash
cd PanQueo/backend
npm install
npm start                      # API en :3000 (sync auto de modelos en dev)

# En otra terminal
cd PanQueo/backend/scripts
node serve_web.js              # Web estática en http://localhost:5500
```

> El login requiere un usuario del backend. Usuario de prueba en SQLite:
> `fase3@panqueo.test` / `Panqueo_2026`

### Identidad visual

- Amarillo de marca `#ffc107` / marrón `#785900`, tipografías **Inter + Poppins**
- Mascota: capibara `SPARKLE.png` (avatar) y muffin `PANQUEO ICONO.png` (logo)
- **Modo oscuro** completo con conmutador en la barra superior (persiste en `localStorage`): dashboard, tarjetas KPI, pedidos, perfil, sheets, formularios y widgets nativos (`color-scheme: dark`)

### Shell de escritorio (≥1024 px)

- **Sidebar fija** con módulos, badges de alertas (stock bajo / cocina) y estado de la API en vivo
- Bottom nav de móvil se oculta; el contenido pasa a un layout ancho
- Vistas full-screen (detalle de pedido, etc.) se presentan como **tarjeta modal de trabajo** (680 px) con backdrop

### Módulos

**Dashboard** — KPIs reales (pedidos, stock bajo, por cobrar, entrega hoy), producción activa con badge "En Cocina".

**Inventario y Lotes** — lista de ingredientes desde la API, **Registrar Lote** real (ingrediente, unidad, precio/moneda), detalle del ingrediente con sus lotes y **ajuste de inventario** (anomalía > 20 % → alerta). Track por fecha de vencimiento FEFO.

**Listas de Compra** — listas sugeridas por la predicción; "Completar lista" genera lotes reales en el inventario.

**Recetas y Producción** — catálogo y detalle con requerimientos de ingredientes; herramientas por receta: verificar stock y simular costo.

**Pedidos** — nuevo pedido real multi-receta (cliente, fecha, estado de pago, cantidades con validación FIFO y pantalla de error de stock), pasar a **En Cocina consume inventario FIFO idempotente**, marcar pagado, tarjeta de éxito.

**Clientes** — búsqueda, registro y perfil con historial desde la API.

**Reportes** (nuevo · Fase 3.4) — tres pestañas:
- **Producción**: unidades producidas con desglose por receta (multi-linea desde `pedido_detalles`)
- **Mermas**: lotes vencidos con stock, cantidad y valor en riesgo
- **Trazabilidad FEFO**: log de cada descuento FIFO (lote, vencimiento, pedido, fecha) con detector de violaciones FEFO

**Calculadora de Precios** (nuevo · Fase 3.4) — elige receta, cantidad de porciones y margen configurable (slider 0–100 %): costo real por porción y total (bimoneda $ / Bs según tasa BCV), precio mínimo (margen 20 %), precio recomendado (35 %) y ganancia estimada.

**Perfil y Tasa BCV** — perfil editable real (`PUT /auth/perfil`), estadísticas dinámicas, **tasa BCV editable en sheet** que alimenta toda la bimoneda.

### Bimoneda BCV

Píldora en la barra superior con 3 modos: **Dual ($ + Bs.) / Solo USD / Solo Bs.** — el modo y la tasa persisten en `localStorage` (`PQ_CURRENCY`) y formatean todos los montos (KPIs, pedidos, reportes, calculadora) con `fmtMoneyHTML`.

### Sistema de sheets + toasts

Todas las interacciones usan bottom-sheets animados (en escritorio, modales centrados) con toasts de feedback — sin `alert()`.

### Archivos

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Shell completa: sidebar, top-bar, tabs, 9 sheets, vistas full-screen |
| `css/style.css` | Estilos base del MVP (identidad amarilla) |
| `css/shell.css` | Shell Fase 3: tokens dark/light, sidebar, sheets, toasts, bimoneda, reset de dark |
| `js/app.js` | Toda la lógica: auth, tabs, bimoneda, sheets, pedidos FIFO, reportes, calculadora |

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
npm run migrate     # PostgreSQL (producción)
npm run seed
npm start           # En development sincroniza los modelos con SQLite
npm test            # 91/91 tests
```

### Endpoints

| Ruta | Módulo |
|------|--------|
| `/api/auth` | Login, register, perfil (`GET/PUT`), logout |
| `/api/inventario` | CRUD ingredientes, lotes, **ajustes de stock**, **alertas** |
| `/api/pedidos` | CRUD pedidos, **cambio de estado (consume FIFO idempotente)** |
| `/api/recetas` | CRUD recetas con ingredientes, **simular-costo**, **verificar-stock** |
| `/api/clientes` | CRUD clientes |
| `/api/compras` | Listas de compra, **completar lista → genera lotes** |
| `/api/finanzas` | Historial de tasa de cambio, sugerencia de precios (dual: Bs/USD) |
| `/api/asistente` | Predicción de compras, anomalías, consumo promedio diario |
| `/api/proveedores` | CRUD proveedores |
| `/api/reportes` | **Producción (por receta)**, **mermas**, **trazabilidad FEFO**, balance de pedidos |

### Modelos (13)

`Usuario`, `Cliente`, `Ingrediente`, `LoteIngrediente`, `Receta`, `RecetaIngrediente`, `Pedido`, `DetallePedido`, `ListaCompra`, `DetalleListaCompra`, `Proveedor`, `HistorialTasaCambio`, `ConsumoLote`

### Servicios

- `FIFOService` — consumo de inventario por **fecha de vencimiento (FEFO/FIFO)** con validación previa, idempotencia por pedido y **log de trazabilidad** en `consumos_lote` dentro de la misma transacción
- `AsistenteService` — predicción de compras, sugerencia de precios dual (Bs/USD) sobre lotes recientes
- `AlertasService` — alertas de stock y vencimiento

### Base de datos dual-dialecto

- **Desarrollo**: SQLite (sync automático de modelos al arrancar; no necesita migraciones)
- **Producción**: PostgreSQL vía migraciones Sequelize (compatibles con ambos dialectos; la migración `20261020000001-create-consumos-lote.js` crea la tabla de trazabilidad FEFO)

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
│   │   │   ├── config/        # Dual-dialecto: SQLite (dev) / PostgreSQL (prod)
│   │   │   ├── controllers/   # 10 controladores
│   │   │   ├── middleware/
│   │   │   ├── migrations/    # 13 migraciones (incl. consumos_lote)
│   │   │   ├── models/        # 13 modelos
│   │   │   ├── routes/        # 11 archivos de rutas
│   │   │   └── services/      # FIFOService, AsistenteService, AlertasService
│   │   ├── scripts/           # serve_web.js (estático :5500), setup-db.js
│   │   ├── .env
│   │   └── package.json
│   └── web/            # HTML + CSS + JS vanilla
│       ├── index.html
│       ├── css/style.css
│       ├── css/shell.css
│       └── js/app.js
├── Documento de desarrollo Maestro My peaplo Toasty.md
└── README.md
```

---

## Notas

- La **app mobile** funciona 100 % con datos mock — no requiere backend
- La **web app** ahora está conectada al backend real: pedidos, inventario FIFO, compras, reportes y calculadora usan la API (JWT Bearer)
- El **backend** mantiene fallback tolerante: si una receta del pedido no tiene ingredientes, el cambio a En Cocina falla con mensaje claro (sin descuentos parciales)
- La carpeta `web/Nueva Propuesta/` es material de referencia de diseño y **no se commitea**
- `stitch_sprinkle_prototipo_app/` y `tmp_expo/` están en `.gitignore` (prototipos de diseño AI y proyecto de prueba)
