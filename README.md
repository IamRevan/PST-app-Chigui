# PanQueo 🧁

**Sistema de gestión inteligente para repostería** — PostgreSQL en desarrollo y producción (SQLite solo para pruebas unitarias).

Tres aplicaciones en un mismo proyecto:

| App | Stack | Estado |
|-----|-------|--------|
| **Web** (`PanQueo/web/`) | HTML + CSS + JS vanilla + Backend real | ✅ Fases 1–3.4 completas — shell escritorio, dark mode, bimoneda BCV, inventario FIFO real, seguridad de cuenta |
| **Mobile** (`PanQueo/app/`) | React Native (Expo ~58), React Navigation 7 | 26 pantallas, navegación funcional, datos mock (requiere npm install + expo) |
| **Backend** (`PanQueo/backend/`) | Node.js + Express + Sequelize | API REST con 10 controladores, 16 modelos, auth endurecida, 138/138 tests |

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

> El login requiere un usuario del backend. Usuario sembrado por defecto:
> `admin@panqueo.com` / `admin123` (cámbialo antes de publicar; las contraseñas nuevas exigen 12 caracteres).
> Si el correo no está verificado, el registro envía un enlace de verificación por correo.

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

**Perfil y Tasa BCV** — perfil editable real (`PUT /auth/perfil`), estadísticas dinámicas, **tasas oficiales USD y EUR sincronizadas desde el BCV** (con opción de ajuste manual) que alimentan toda la bimoneda.

**Seguridad** — cambio de contraseña con política de 12 caracteres, activación/desactivación de **MFA TOTP** con códigos de recuperación, lista de **sesiones activas** con revocación individual o global y **actividad de autenticación** reciente. Está disponible con el mismo comportamiento en la web y en la app móvil (`Perfil → Seguridad de la Cuenta`).

### Bimoneda BCV

Píldora en la barra superior con 3 modos: **Dual ($ + Bs.) / Solo USD / Solo Bs.** — el modo y las tasas persisten en `localStorage` (`PQ_CUR_MODE`) y formatean todos los montos (KPIs, pedidos, reportes, calculadora) con `fmtMoneyHTML`. La píldora muestra **las dos tasas oficiales** (`$ 888,12 · € 989,72`) y un punto verde cuando la última sincronización con el BCV está fresca.

**Tasa de trabajo (USD o EUR)**: al hacer clic en `$` o `€` dentro de la píldora (o en las tarjetas del sheet de tasas) se elige con qué tasa se calculan **todos los bolívares** de la app. La tasa activa queda resaltada en ámbar y se guarda en `localStorage` (`PQ_TASA_BASE`). Ejemplo con la misma tasa BCV: `$ 6,00` → `5.328,71 Bs.` con tasa USD y `5.938,31 Bs.` con tasa EUR. En móvil se elige igual desde **Configuración → Tasas oficiales BCV** (la tarjeta activa muestra “EN USO”).

### Tasas oficiales automáticas (USD + EUR)

El backend consulta **https://www.bcv.org.ve/** y guarda en `historial_tasa_cambio` una fila por `fecha_valor` con `valor_bs_por_usd` y `valor_bs_por_eur`:

- **Al arrancar** el servidor y luego **cada 60 minutos** (`BCV_SYNC_INTERVAL_MIN`, mínimo 5). El planificador vive en el proceso de la API, no requiere cron externo.
- **Sincronización manual** desde la web (`Tasas oficiales BCV → Sincronizar ahora`) o el móvil (`Configuración → Sincronizar ahora con el BCV`), vía `POST /api/finanzas/tasas/sincronizar`.
- Si el sitio del BCV no responde o cambia su estructura, se usa como respaldo la API pública `ve.dolarapi.com` (misma data oficial); la respuesta lo indica en `meta.respaldo`.
- El certificado del BCV suele venir con la cadena incompleta: se intenta con validación TLS estricta y, solo si falla por certificado, se reintenta sin validarla para ese host.
- El ajuste manual (`POST /api/finanzas/tasas`) sigue disponible y se sobrescribe en la siguiente sincronización automática.

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

## Autenticación y seguridad

Diseño alineado con OWASP ASVS: sesiones revocables en servidor, cookies httpOnly, CSRF de doble envío,
política moderna de contraseñas, límites de intentos, auditoría y MFA opcional.

### Sesiones

| Cliente | Mecanismo |
|---------|-----------|
| Web | Cookie `pq_session` **httpOnly**, `SameSite=Lax`, `Secure` en producción. El JWT nunca se guarda en `localStorage`. |
| Web (mutaciones) | Cookie legible `pq_csrf` + cabecera `X-CSRF-Token` (double submit). Sin ella, la API responde `403 CSRF_INVALIDO`. |
| Móvil | `Authorization: Bearer …` en el cuerpo, activado con `X-Client-Type: mobile` (Expo Go no maneja cookies de sesión). |

- Cada login crea una fila en `sesiones` con `jti`, IP, user-agent, expiración (12 h por defecto) y `revocada_at`.
- La API valida el JWT **y** la sesión en base de datos en cada petición: revocar una sesión invalida su token al instante.
- `POST /auth/logout` revoca la sesión actual y limpia cookies; `POST /auth/logout-todos` revoca todas.
- `GET /auth/sesiones` lista las sesiones activas (con marca “esta sesión”) y `DELETE /auth/sesiones/:id` permite revocar cualquier dispositivo.
- Al cambiar/restablecer la contraseña se revocan las demás sesiones automáticamente.

### Contraseñas

- **12–72 caracteres** (bcrypt trunca a 72 bytes), sin reglas de composición: frases largas bienvenidas.
- Rechazo de contraseñas comunes (lista local) y **filtradas** vía HIBP k-anonymity (solo se envían los 5 primeros caracteres del SHA-1).
- Si la consulta a HIBP falla o expira (3 s), la comprobación es **fail-open** para no bloquear el registro; `PASSWORD_BREACH_CHECK=off` la desactiva.
- `bcrypt` con coste 12 para usuarios nuevos. Los hashes antiguos (coste 10) se **migran automáticamente a 12** al iniciar sesión, sin pedir nada al usuario.
- Nunca se registra la contraseña en logs ni se devuelve en respuestas.

### Verificación de correo, recuperación y MFA

- **Verificación obligatoria**: un usuario sin `email_verificado_at` no puede iniciar sesión (`403 EMAIL_NO_VERIFICADO`).
- Tokens de verificación (24 h) y recuperación (30 min) generados con 32 bytes aleatorios; en la base solo se guarda su **SHA-256**. Se consumen al usarse.
- **MFA TOTP opcional** (RFC 6238, SHA-1, 6 dígitos, 30 s, ventana ±1) con anti-repetición (`mfa_last_step`) y **10 códigos de recuperación** de un solo uso (almacenados con hash).
- Activar/desactivar MFA y cambiar contraseña/correo exigen **reautenticación** (contraseña actual; MFA también pide código vigente).
- **Correo transaccional por SMTP**: verificación y recuperación envían un enlace real con plantilla HTML y versión de texto. Si SMTP no está configurado, la API sigue funcionando y los enlaces se escriben en el log del servidor.
- La web procesa enlaces `?verify=…` y `?reset=…`, y muestra un panel de desarrollo con el token cuando corresponde.

### Roles y panel de administración

- Cuatro roles: `admin`, `desarrollador`, `cocinero` y `vendedor`.
- **El registro público nunca concede privilegios**: las cuentas nuevas se crean como `vendedor` (mínimo privilegio); un admin/desarrollador asigna luego roles elevados.
- **Panel de gestión de usuarios** (solo visible para `admin` y `desarrollador`), en la web (barra lateral + Perfil → Gestión de usuarios) y en la app móvil (Perfil → Gestión de usuarios):
  - Lista todos los usuarios con rol, estado, verificación y MFA.
  - Asigna o quita roles; activa o desactiva cuentas.
- Guardas de seguridad:
  - No puedes cambiarte el rol ni desactivar tu propia cuenta.
  - No se puede quitar el rol ni desactivar al **último administrador activo** (evita quedar bloqueado).
  - Todos los cambios se auditan (`rol_cambiado`, `usuario_activado`, `usuario_desactivado`).

### Defensas de acceso

- Errores genéricos: correo inexistente y contraseña incorrecta devuelven el **mismo** `401 CREDENCIALES_INVALIDAS`.
- Registro duplicado y solicitud de recuperación devuelven mensajes neutros (no revelan si el correo existe).
- **Bloqueo por cuenta**: 5 fallos → 15 min (`CUENTA_BLOQUEADA`), con contador reiniciado al entrar.
- **Rate limiting por IP**: login 10/15 min, registro 10/h, recuperación 5/15 min, MFA 10/15 min.
- **Auditoría** en `auth_eventos` (login, fallos, bloqueos, MFA, cambios de contraseña/correo, revocaciones) visible en **Perfil → Seguridad → Actividad reciente**.
- `helmet`, CORS con allowlist y `credentials`, cuerpo JSON limitado a 100 kb, `requireHttps` en producción y `trust proxy` configurable.
- `SameSite=Lax` + validación de `Origin` en mutaciones mitiga CSRF; no se aceptan tokens por query string.

### Variables de entorno relevantes

```env
AUTH_SESSION_TTL_HOURS=12
AUTH_COOKIE_SECURE=false        # true en producción (HTTPS)
AUTH_ENFORCE_HTTPS=false        # true en producción
CORS_ORIGINS=http://localhost:5500
APP_URL=http://localhost:5500
AUTH_MAX_FAILED_ATTEMPTS=5
AUTH_LOCKOUT_MINUTES=15
AUTH_LOGIN_RATE_LIMIT=10
AUTH_RECOVERY_RATE_LIMIT=5
AUTH_PASSWORD_MIN_LENGTH=12
PASSWORD_BREACH_CHECK=on
AUTH_VERIFY_TTL_HOURS=24
AUTH_RESET_TTL_MINUTES=30
AUTH_MFA_ISSUER=PanQueo
# Correo (opcional en desarrollo; necesario para recuperación real en producción)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_clave_de_aplicacion
MAIL_FROM=PanQueo <tu_correo@gmail.com>
```

### Envío de correos (SMTP)

El servicio `backend/src/services/EmailService.js` usa **nodemailer** y se activa en cuanto exista
`SMTP_HOST` (o `MAIL_ENABLED=true`). No hay proveedor atado: sirve cualquier SMTP.

**Desarrollo sin correo**: deja `SMTP_HOST` vacío. El enlace de verificación/recuperación se imprime
en la consola de la API (para depuración local).

**Desarrollo/pruebas con Gmail**:

1. Activa la verificación en dos pasos en la cuenta de Google.
2. Crea una **contraseña de aplicación** (Cuenta de Google → Seguridad → Contraseñas de aplicaciones).
3. Añade a `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tucuenta@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
MAIL_FROM=PanQueo <tucuenta@gmail.com>
```

**Producción**: usa un proveedor transaccional (Brevo, Resend, Mailgun, Amazon SES, Postmark, etc.)
y verifica el dominio remitente con **SPF, DKIM y DMARC**. Ejemplos de host:

| Proveedor | `SMTP_HOST` | Puerto | Usuario / contraseña |
|-----------|-------------|--------|----------------------|
| Gmail | `smtp.gmail.com` | 587 | correo / contraseña de aplicación |
| Outlook / M365 | `smtp.office365.com` | 587 | correo / contraseña o app password |
| Brevo | `smtp-relay.brevo.com` | 587 | login SMTP / clave SMTP |
| Resend | `smtp.resend.com` | 587 | `resend` / API key |
| Mailgun | `smtp.mailgun.org` | 587 | usuario SMTP / contraseña SMTP |
| Amazon SES | `email-smtp.<región>.amazonaws.com` | 587 | credenciales SMTP de SES |

- `MAIL_FROM` debe ser una dirección **verificada** en el proveedor; si no, el correo será rechazado o irá a spam.
- `SMTP_SECURE=true` solo para el puerto **465**; en 587 se usa STARTTLS con `SMTP_SECURE=false`.
- El envío es asíncrono y **no bloquea** registro/recuperación. Un fallo de SMTP no revela si el correo existe.
- En producción no se escriben enlaces ni tokens en los logs; el enlace solo viaja en el correo.
- Al arrancar, la API comprueba la conexión SMTP y avisa en consola si no está configurado.

**Comprobar la configuración** sin tocar la app:

```bash
cd backend
npm run mail:test -- tu-correo@gmail.com
```

Verifica la conexión, envía un mensaje de prueba y muestra el error exacto de SMTP si algo falla.
Un `535-5.7.8 Username and Password not accepted` significa que la clave no es una contraseña de
aplicación válida (o que la cuenta no tiene la verificación en dos pasos activada).

### Endpoints de autenticación

| Método y ruta | Uso |
|---------------|-----|
| `POST /api/auth/login` | Login; responde `MFA_REQUERIDO` si hace falta segundo factor |
| `POST /api/auth/mfa/verificar` | Verifica TOTP o código de recuperación y emite la sesión |
| `POST /api/auth/register` | Registro con verificación de correo |
| `POST /api/auth/verificar-email` | Consume el token de verificación |
| `POST /api/auth/reenviar-verificacion` | Reenvía el enlace (respuesta neutra) |
| `POST /api/auth/solicitar-recuperacion` | Solicita enlace de recuperación (respuesta neutra) |
| `POST /api/auth/restablecer-password` | Define la nueva contraseña y revoca sesiones |
| `GET/PUT /api/auth/perfil` | Perfil del usuario autenticado |
| `POST /api/auth/cambiar-password` | Cambio con contraseña actual + revocación de otras sesiones |
| `POST /api/auth/cambiar-email` | Cambio de correo con reautenticación |
| `POST /api/auth/logout` · `/logout-todos` | Cierra la sesión actual o todas |
| `GET /api/auth/sesiones` · `DELETE /api/auth/sesiones/:id` | Lista y revoca dispositivos |
| `GET /api/auth/eventos` | Últimos eventos de seguridad |
| `GET /api/auth/mfa/estado` · `POST /iniciar` · `POST /activar` · `POST /desactivar` | Gestión TOTP |
| `GET /api/admin/usuarios` | Lista usuarios (roles y estado) — solo `admin`/`desarrollador` |
| `PATCH /api/admin/usuarios/:id/rol` | Asigna o quita un rol |
| `PATCH /api/admin/usuarios/:id/estado` | Activa o desactiva una cuenta |

> **Correo:** sin SMTP la app sigue operativa en desarrollo (el enlace se imprime en la consola de la API); para producción configura SMTP, `MAIL_FROM` y la autenticación del dominio.
> Al desplegar, sirve todo por HTTPS, activa `AUTH_COOKIE_SECURE` y `AUTH_ENFORCE_HTTPS`, y rota `JWT_SECRET`.

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
npm run migrate     # migraciones (usa DB_ADMIN_USER)
npm run seed
npm start           # API en :3000 (usa DB_USER = rol de la app)
npm test            # 146/146 tests
```

### Endpoints

| Ruta | Módulo |
|------|--------|
| `/api/auth` | Login, register, verificación, recuperación, perfil (`GET/PUT`), MFA, sesiones, eventos, logout |
| `/api/inventario` | CRUD ingredientes, lotes, **ajustes de stock**, **alertas** |
| `/api/pedidos` | CRUD pedidos, **cambio de estado (consume FIFO idempotente)** |
| `/api/recetas` | CRUD recetas con ingredientes, **simular-costo**, **verificar-stock** |
| `/api/clientes` | CRUD clientes |
| `/api/compras` | Listas de compra, **completar lista → genera lotes** |
| `/api/finanzas` | Historial de tasa de cambio, sugerencia de precios (dual: Bs/USD) |
| `/api/asistente` | Predicción de compras, anomalías, consumo promedio diario |
| `/api/proveedores` | CRUD proveedores |
| `/api/reportes` | **Producción (por receta)**, **mermas**, **trazabilidad FEFO**, balance de pedidos |

### Modelos (16)

`Usuario`, `Cliente`, `Ingrediente`, `LoteIngrediente`, `Receta`, `RecetaIngrediente`, `Pedido`, `DetallePedido`, `ListaCompra`, `DetalleListaCompra`, `Proveedor`, `HistorialTasaCambio`, `ConsumoLote`, `Sesion`, `TokenAuth`, `AuthEvento`

### Servicios

- `FIFOService` — consumo de inventario por **fecha de vencimiento (FEFO/FIFO)** con validación previa, idempotencia por pedido y **log de trazabilidad** en `consumos_lote` dentro de la misma transacción
- `AsistenteService` — predicción de compras, sugerencia de precios dual (Bs/USD) sobre lotes recientes
- `AlertasService` — alertas de stock y vencimiento
- `BCVService` — scraper de bcv.org.ve (bloques `#dolar` / `#euro`) con respaldo en `ve.dolarapi.com`, caché de 5 min y reintento TLS
- `TasaCambioService` — upsert de las tasas USD/EUR por `fecha_valor` (redondeo a 4 decimales para que re-sincronizar sea idempotente)
- `TasaSyncScheduler` — sincronización automática al arrancar y cada `BCV_SYNC_INTERVAL_MIN` minutos
- `PasswordPolicy` — longitud, lista local de contraseñas comunes y HIBP k-anonymity (fail-open)
- `TotpService` — TOTP RFC 6238 con ventana ±1, anti-repetición y códigos de recuperación
- `TokenService` — tokens aleatorios de un solo uso; solo se persiste su hash SHA-256
- `SessionService` — sesiones revocables, cookies httpOnly/CSRF, emisión Bearer para móvil
- `AuditService` — registro de eventos de autenticación con IP y user-agent

### Base de datos (PostgreSQL)

- **Dialecto**: PostgreSQL (se mantiene el fallback a SQLite solo para pruebas unitarias; en desarrollo y producción se usa `DB_DIALECT=postgres`).
- **Migraciones** (17): esquema versionado con Sequelize. Las migraciones `20261020000001-create-consumos-lote.js`, `20261028000001-add-euro-tasas-bcv.js` y `20261029000001-auth-hardening.js` añaden trazabilidad FEFO, tasa EUR y el esquema de seguridad (sesiones, tokens y auditoría).
- **Integridad declarativa** (`20261030000001-db-integrity.js`): 22 restricciones `CHECK` (montos no negativos, cantidades positivas, fechas lógicas, `monto_abonado <= costo_total`, vigencia de sesiones/tokens), la FK que faltaba en `consumos_lote.id_ingrediente` y un índice único de una tasa por `fecha_valor`.
- **Índices** (`20261030000002-db-index-cleanup.js`): se eliminaron 5 índices que duplicaban a una restricción UNIQUE o a un índice compuesto y se añadieron 3 que usan las consultas reales (`proveedores.nombre`, `consumos_lote.created_at`, `pedidos.fecha_entrega`).

### Separación de cuentas (mínimo privilegio)

La API **nunca** usa el superusuario:

| Variable | Rol | Uso |
|----------|-----|-----|
| `DB_USER` / `DB_PASSWORD` | `panqueo_app` | La API: solo `SELECT/INSERT/UPDATE/DELETE` y secuencias, sin DDL. |
| `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` | `postgres` | Migraciones y respaldos (solo el desarrollador). |

Para crear el rol de la aplicación (con contraseña propia o generada):

```bash
cd backend
npm run db:create-app-role -- panqueo_app            # genera una clave aleatoria
npm run db:create-app-role -- panqueo_app "tu-clave" # con clave propia
```

El script aplica los privilegios, verifica que el rol **no** pueda crear tablas y actualiza `.env`.

### Respaldos y recuperación

```bash
npm run db:backup               # crea un dump comprimido en backend/backups/ y rota los antiguos
npm run db:backup -- --verify   # además restaura en una base temporal y compara tablas
npm run db:restore -- backups/panqueo-AAAAMMDD-HHMMSS.dump   # restaura la base configurada
```

- Formato `pg_dump -Fc` (compilado), rotación de 7 días (`BACKUP_KEEP_DAYS`), nunca se borra el más reciente.
- `--verify` comprueba que la restauración funciona de verdad (se crea una base temporal, se restaura y se compara el número de tablas) antes de borrarla.
- La carpeta `backend/backups/` está en `.gitignore`: los respaldos no se versionan.
- En producción, programa `db:backup` con el Programador de tareas de Windows (o cron) a diario y guarda una copia fuera de la máquina.


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
│   │   │   ├── config/        # Sequelize (PostgreSQL) + config de app/mail/auth
│   │   │   ├── controllers/   # 10 controladores
│   │   │   ├── middleware/
│   │   │   ├── migrations/    # 15 migraciones (incl. consumos_lote, tasas EUR y auth-hardening)
│   │   │   ├── models/        # 16 modelos
│   │   │   ├── routes/        # 11 archivos de rutas
│   │   │   └── services/      # FIFO, asistente, alertas, BCV, password policy, TOTP, sesiones, auditoría
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
- La **web app** ahora está conectada al backend real: pedidos, inventario FIFO, compras, reportes y calculadora usan la API, con **sesión por cookie httpOnly + CSRF** (el JWT ya no vive en `localStorage`)
- El **backend** mantiene fallback tolerante: si una receta del pedido no tiene ingredientes, el cambio a En Cocina falla con mensaje claro (sin descuentos parciales)
- **Correo transaccional por SMTP**: verificación y recuperación envían un enlace real con plantilla HTML y versión de texto. El enlace únicamente viaja por correo (ya no se expone `dev_token` en la API).
- La carpeta `web/Nueva Propuesta/` es material de referencia de diseño y **no se commitea**
- `stitch_sprinkle_prototipo_app/` y `tmp_expo/` están en `.gitignore` (prototipos de diseño AI y proyecto de prueba)
