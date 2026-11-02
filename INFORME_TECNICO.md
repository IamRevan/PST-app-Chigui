# Informe técnico — PanQueo

**Documento interno de cambios y credenciales compartidas**
Fecha: 28 de octubre de 2026
Estado: desarrollo (pre-producción)

> ⚠️ **CONFIDENCIAL — SOLO USO INTERNO.**
> Este documento contiene credenciales de desarrollo. **No lo publiques en un repositorio público ni lo compartas fuera del equipo.** Antes de desplegar a producción se deben rotar las claves aquí listadas (ver sección "Recomendaciones de seguridad").

---

## 1. Resumen ejecutivo

Se realizó un endurecimiento integral del proyecto **PanQueo** (gestión de repostería) en cuatro frentes:

1. **Autenticación y seguridad** (web + móvil): sesiones revocables, verificación de correo, recuperación de contraseña, política moderna de contraseñas, protección anti-fuerza-bruta y **MFA (verificación en dos pasos)**.
2. **Correo transaccional real** (SMTP con Gmail) para envío de enlaces de verificación y recuperación.
3. **Base de datos**: integridad declarativa (CHECK/FK/UNIQUE), limpieza de índices, separación de cuentas (rol de app vs. administrador), respaldos automáticos y **panel de administración de usuarios con roles**.
4. **Paridad web ↔ app + correcciones de UI**: ambas plataformas alineadas en funcionalidad (recetas, listas de compra, reportes, ingredientes, dashboard, roles) y resueltos múltiples bugs de flujo (pagos, navegación, teclado, refresco de datos, fechas).

Se añadió un **nuevo rol `desarrollador`** y un **panel de gestión de usuarios** visible solo para `admin`/`desarrollador`, disponible en web y móvil.

**Estado de pruebas:** 155 tests automáticos pasando (25 suites) + pruebas de punta a punta en navegador y en dispositivo.

---

## 2. Arquitectura y servicios

| Servicio | URL / puerto | Descripción |
|----------|--------------|-------------|
| API backend | `http://localhost:3000` | Node.js + Express + Sequelize + PostgreSQL |
| Web app | `http://localhost:5500` | SPA estática (HTML + Tailwind + JS) |
| Móvil (Expo/Metro) | `http://localhost:8081` (web) · `exp://192.168.0.5:8081` (dispositivo) | React Native / Expo |

Comandos para levantar:

```bash
# Backend (carpeta PanQueo/backend)
npm run migrate && npm start      # API en :3000

# Web (carpeta PanQueo/backend)
node scripts/serve_web.js         # web estática en :5500

# Móvil (carpeta PanQueo/app)
npx expo start --lan              # Metro en :8081
```

---

## 3. Autenticación y seguridad

### 3.1 Sesiones

| Cliente | Mecanismo |
|---------|-----------|
| Web | Cookie `pq_session` **httpOnly** + cookie `pq_csrf` legible (double-submit). El JWT **nunca** se guarda en `localStorage`. |
| Móvil | `Authorization: Bearer …` en el cuerpo, activado con cabecera `X-Client-Type: mobile`. |

- Cada login crea una fila en `sesiones` con `jti`, IP, user-agent, expiración (12 h) y `revocada_at`.
- La API valida el JWT **y** la sesión en base de datos en cada petición: revocar una sesión invalida su token al instante.
- `POST /auth/logout` cierra la sesión actual; `POST /auth/logout-todos` cierra todas.
- Se eliminó el "Recordarme" falso; la sesión es fija de 12 h.

### 3.2 Contraseñas

- **12–72 caracteres**, sin reglas de composición (frases largas bienvenidas).
- Rechazo de contraseñas comunes (lista local) y de contraseñas **filtradas** vía HIBP k-anonymity (solo se envían los 5 primeros caracteres del SHA-1; `fail-open` si HIBP falla).
- `bcrypt` coste 12. Los hashes antiguos (coste 10) se **migran automáticamente a 12** al iniciar sesión, sin intervención del usuario.
- Nunca se registra la contraseña en logs ni se devuelve en respuestas.

### 3.3 Verificación de correo y recuperación

- La verificación es **obligatoria**: un usuario sin `email_verificado_at` recibe `403 EMAIL_NO_VERIFICADO`.
- Tokens de verificación (24 h) y recuperación (30 min) con 32 bytes aleatorios; en BD solo se guarda su **SHA-256**. Se consumen al usarse.
- Los enlaces usan `?verify=…` y `?reset=…` en la web; en móvil se procesan de forma equivalente.

### 3.4 MFA (verificación en dos pasos)

- **TOTP** RFC 6238 (SHA-1, 6 dígitos, 30 s, ventana ±1) con anti-repetición.
- **10 códigos de recuperación** de un solo uso (almacenados con hash; se muestran solo una vez al activar).
- Activar/desactivar MFA y cambiar contraseña/correo exigen **reautenticación**.
- Soporte en web (Perfil → Seguridad) y móvil (SeguridadScreen).

### 3.5 Defensas de acceso

- Errores genéricos: correo inexistente y contraseña incorrecta devuelven el **mismo** `401 CREDENCIALES_INVALIDAS` (sin fugas de existencia de cuenta).
- **Bloqueo por cuenta**: 5 fallos → 15 min (`CUENTA_BLOQUEADA`).
- **Rate limiting por IP**: login 10/15 min, registro 10/h, recuperación 5/15 min, MFA 10/15 min.
- **Auditoría** en `auth_eventos` (login, fallos, bloqueos, MFA, cambios, revocaciones) visible en Perfil → Seguridad.
- `helmet`, CORS con allowlist + `credentials`, cuerpo JSON limitado a 100 KB, `requireHttps` en producción, `SameSite=Lax` + validación de `Origin`.
- Autofill correcto en los formularios (`autocomplete` en correo/contraseña/códigos).

---

## 4. Tasas oficiales BCV (USD y EUR)

- Scraper de `bcv.org.ve` (bloques `#dolar` / `#euro`) con respaldo en `ve.dolarapi.com`.
- Una fila por `fecha_valor` en `historial_tasa_cambio` (índice único).
- Sincronización automática al arrancar y cada `BCV_SYNC_INTERVAL_MIN` (60) minutos; caché en memoria de 5 min.
- La tasa de trabajo (USD o EUR) se puede elegir desde la interfaz; se persiste en `PQ_TASA_BASE` (web) / `STORAGE_KEYS.TASA_BASE` (móvil).
- Al momento de este informe: **USD 888,12 Bs · EUR 989,72 Bs** (fuente BCV).

---

## 5. Correo transaccional (SMTP)

- Servicio `EmailService.js` con **nodemailer**, plantillas HTML + texto, escape de HTML y envío asíncrono (fail-open: un fallo de SMTP no tumba registro/recuperación).
- Se activa automáticamente al definir `SMTP_HOST` (o `MAIL_ENABLED=true`).
- **Configurado con Gmail** (`smtp.gmail.com:587` con STARTTLS).
- Si SMTP no está configurado, los enlaces se imprimen en la consola de la API (depuración local). **Ya no se devuelve `dev_token`/`dev_link`** en las respuestas.
- Comprobación: `npm run mail:test -- correo@ejemplo.com`.

---

## 6. Base de datos (endurecimiento)

### 6.1 Migraciones (18 aplicadas)

| Migración | Contenido |
|-----------|-----------|
| `20260711000001` … `20260711000012` | Tablas base (proveedores, usuarios, ingredientes, clientes, recetas, lotes, pedidos, listas de compra, tasas, detalles) |
| `20261020000001-create-consumos-lote` | Trazabilidad FIFO/FEFO |
| `20261028000001-add-euro-tasas-bcv` | Tasa EUR |
| `20261029000001-auth-hardening` | Sesiones, tokens de un solo uso, auditoría, campos MFA |
| `20261030000001-db-integrity` | **22 CHECK** + FK faltante + índice único de tasa por fecha |
| `20261030000002-db-index-cleanup` | Elimina 5 índices redundantes, añade 3 útiles, borra 2 enums huérfanos |
| `20261030000003-add-rol-desarrollador` | Añade el rol `desarrollador` |

### 6.2 Integridad declarativa (nuevo)

Se añadieron **22 restricciones `CHECK`**, entre ellas:
- Montos no negativos (`costo_total >= 0`, `monto_abonado >= 0`, `precio_unitario >= 0`).
- `monto_abonado <= costo_total`.
- Cantidades positivas (`cantidad_consumida > 0`, `cantidad_requerida > 0`, etc.).
- Coherencia de lotes (`cantidad_actual >= 0`, `cantidad_actual <= cantidad_inicial`, `fecha_venc >= fecha_ingreso`).
- Fechas lógicas (`fecha_entrega >= fecha_pedido`).
- Vigencia de sesiones y tokens (`expira_at > creada_at` / `> created_at`).
- FK que faltaba en `consumos_lote.id_ingrediente`.
- Índice único de una tasa por `fecha_valor`.

### 6.3 Índices

- Eliminados 5 índices que duplicaban una restricción UNIQUE o un índice compuesto.
- Añadidos 3 que usan las consultas reales: `proveedores.nombre`, `consumos_lote.created_at`, `pedidos.fecha_entrega`.

### 6.4 Separación de cuentas (mínimo privilegio)

| Variable | Rol | Uso |
|----------|-----|-----|
| `DB_USER` / `DB_PASSWORD` | `panqueo_app` | La API: solo `SELECT/INSERT/UPDATE/DELETE` y secuencias, **sin DDL**. |
| `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` | `postgres` | Migraciones y respaldos (solo desarrollador). |

- Script: `npm run db:create-app-role -- panqueo_app` (crea el rol, aplica privilegios y verifica que no pueda crear tablas).

### 6.5 Respaldos y recuperación

- `npm run db:backup` → dump comprimido (`pg_dump -Fc`) en `backend/backups/` con rotación de 7 días.
- `npm run db:backup -- --verify` → además restaura en una base temporal y compara tablas.
- `npm run db:restore -- <archivo>` → restaura la base.
- La restauración fue **comprobada** (17 tablas restauradas correctamente).

---

## 7. Roles y panel de administración (nuevo)

### 7.1 Roles

| Rol | Descripción |
|-----|-------------|
| `admin` | Administrador: acceso total + gestión de usuarios. |
| `desarrollador` | **Nuevo**: mismos permisos de gestión que `admin`. |
| `cocinero` | Operación de cocina. |
| `vendedor` | Ventas (mínimo privilegio). |

### 7.2 Endpoints (protegidos con `admin`/`desarrollador`)

| Método y ruta | Función |
|---------------|---------|
| `GET /api/admin/usuarios` | Lista usuarios (rol, estado, verificación, MFA) |
| `PATCH /api/admin/usuarios/:id/rol` | Asigna o quita un rol |
| `PATCH /api/admin/usuarios/:id/estado` | Activa o desactiva una cuenta |

### 7.3 Panel en la interfaz

- **Web**: barra lateral "Usuarios y Roles" (escritorio) + Perfil → "Gestión de usuarios" (móvil).
- **Móvil**: Perfil → "Gestión de usuarios" (`UsuariosScreen`).

### 7.4 Guardas de seguridad del panel

- No puedes cambiarte el rol ni desactivar tu propia cuenta.
- No se puede quitar el rol ni desactivar al **último administrador activo**.
- Todos los cambios se auditan (`rol_cambiado`, `usuario_activado`, `usuario_desactivado`).

### 7.5 Corrección importante de seguridad

Se detectó que el registro público **no asignaba rol** y el modelo tenía `defaultValue: 'admin'`, por lo que **cualquiera que se registrara se convertía en administrador**. Se corrigió:

- El alta pública ahora crea cuentas como **`vendedor`** (mínimo privilegio).
- El `defaultValue` del modelo cambió a `vendedor`.

> Nota: el usuario `roiner.ying2018@gmail.com` quedó como `admin` porque se registró con el comportamiento anterior. Se puede cambiar desde el panel si se desea.

---

## 8. Paridad web ↔ app y correcciones de UI

Las funcionalidades de web y móvil quedaron **alineadas**, y se resolvieron bugs de flujo detectados en las pruebas en dispositivo.

### Funcionalidades alineadas

| Área | Estado |
|------|--------|
| Recetas: **crear receta** (antes la web solo listaba) | ✅ web + móvil |
| Listas de Compra: **editor completo** (crear/editar, marcar comprado, guardar borrador, completar → lotes) | ✅ web + móvil |
| Reportes: pestaña **Balance** (ingresos / pendiente por cobrar) | ✅ web + móvil |
| Inventario: **nuevo ingrediente** | ✅ web + móvil |
| Dashboard: KPIs idénticos (Pedidos Registrados, Stock Bajo, Por Cobrar, Entrega Hoy) | ✅ |
| Usuarios/Roles (admin) | ✅ |
| Fechas en **hora local** (sin desfase UTC) | ✅ |
| Editor de **URL del servidor** (web) | ✅ |

### Correcciones de bugs

| Bug | Solución |
|-----|----------|
| "Marcar Pagado" fallaba en pedidos con abono parcial | `monto_abonado` ahora es **monto total** (no incremental); se valida `<= costo_total` |
| Pantallas de éxito mostraban datos mock ("Donas…", "#1045") | Muestran datos reales pasados por `route.params` |
| Navegación cruzada a pestañas desde pantallas del stack ("NAVIGATE not handled") | Navegar vía `navigate('Tabs', { screen: … })` |
| Teclado tapaba campos en modales | `KeyboardAvoidingView` + `ScrollView keyboardShouldPersistTaps` |
| Pantallas no refrescaban al volver | `useFocusEffect` + `refetch` estable en `useData` |
| "Stock Crítico" mostraba vencimientos | Usa `useAlertasStockBajo` con los campos correctos |
| Dashboard "Pedidos" mostraba conteo incorrecto | "Pedidos Registrados" = total; "Entrega Hoy" = `fecha_entrega` de hoy |
| Token de recuperación/verificación visible en UI ("solo desarrollo") | Eliminado de backend (respuesta), web y móvil |
| Mock muerto `RegistroExitosoScreen` | Eliminado |

### Correcciones de backend relevantes

- `POST /compras/listas` ahora persiste `cantidad_comprada` (antes lo descartaba).
- `POST /pedidos` ahora persiste `monto_abonado` coherente cuando el pedido nace "Pagado".

---

## 9. Usuarios y credenciales compartidas

> ⚠️ Todas estas credenciales son de **desarrollo**. Antes de producción hay que rotarlas.
> 🔒 Los valores sensibles (contraseñas de BD, SMTP y JWT) están **ofuscados (`***`)** porque el repositorio es público. Los valores reales viven en el archivo local `PanQueo/backend/.env` (ignorado por git).

### 9.1 Cuentas de la aplicación (inicio de sesión)

| Correo | Contraseña | Rol | MFA |
|--------|-----------|-----|-----|
| `admin@panqueo.com` | `admin123` | `admin` | ✅ Activo (TOTP) |
| `cocinero@panqueo.com` | `admin123` | `cocinero` | ❌ |
| `vendedor@panqueo.com` | `admin123` | `vendedor` | ❌ |
| `roiner.ying2018@gmail.com` | *(establecida por el usuario)* | `admin` | ❌ |

> ⚠️ Las contraseñas sembradas (`admin123`) son de **prueba** y no cumplen la política (mínimo 12 caracteres). Se recomienda cambiarlas al iniciar sesión.

### 9.2 Base de datos (PostgreSQL, puerto 5432, base `panqueo`)

| Propósito | Usuario | Contraseña |
|-----------|---------|-----------|
| Aplicación (API) | `panqueo_app` | `***` |
| Administración (migraciones/backups) | `postgres` | `***` |

### 9.3 Correo (SMTP Gmail)

| Campo | Valor |
|-------|-------|
| Host / puerto | `smtp.gmail.com:587` (STARTTLS) |
| Usuario | `mipanaderiapst@gmail.com` |
| Contraseña de aplicación | `***` |
| Remitente | `PanQueo <mipanaderiapst@gmail.com>` |

> La contraseña de aplicación se generó en `myaccount.google.com/apppasswords`. Si se cambia la contraseña de la cuenta o se desactiva la verificación en dos pasos, la app password se revoca y los correos dejan de salir (error `535-5.7.8`).

### 9.4 Otras claves de configuración

| Clave | Valor |
|-------|-------|
| `JWT_SECRET` | `***` |
| `DB_NAME` | `panqueo` |

---

## 10. Configuración de entorno (`.env` del backend)

```env
PORT=3000
NODE_ENV=development
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=panqueo
DB_USER=panqueo_app
DB_PASSWORD=***REDACTADO***
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=***REDACTADO***
JWT_SECRET=***REDACTADO***
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mipanaderiapst@gmail.com
SMTP_PASS=***REDACTADO***
MAIL_FROM=PanQueo <mipanaderiapst@gmail.com>
SMTP_TIMEOUT_MS=10000
```

> El archivo `backend/.env` está en `.gitignore` (no se versiona). El resto de variables documentadas están en `backend/.env.example`.

---

## 11. Pruebas

- **Backend**: `npm test` → **155/155 tests** en **25 suites** (incluye `AdminController`, `EmailService`, `PasswordPolicy`, `TotpService`, `FIFOService`, `BCVService`, etc.).
- **Pruebas de punta a punta** en navegador:
  - Web: login admin con MFA, listar usuarios, cambiar rol, activar/desactivar, guardas (rol propio, último admin).
  - Web: crear receta, crear/finalizar lista de compra (→ lotes), nuevo ingrediente, balance.
  - Móvil (Expo web): renderizado del panel, cambio de rol por toque de píldora (persistido en BD).
- **Pruebas en dispositivo (celular, Expo Go)**: login, MFA, inventario, pedidos, listas de compra, registro de lotes, navegación entre pestañas, refresco al volver, teclado en modales.
- **Correo**: envío real verificado contra Gmail y contra un SMTP de pruebas (Ethereal).
- **Validaciones de bugs resueltos**: "marcar pagado" (abono parcial y total), navegación a pestañas, datos reales en pantallas de éxito, "Stock Crítico", "Pedidos Registrados".

---

## 12. Archivos principales modificados/creados

### Backend
- `src/migrations/*` — migraciones (integridad, índices, rol desarrollador).
- `src/services/EmailService.js` — SMTP + plantillas.
- `src/services/` — `PasswordPolicy`, `TotpService`, `TokenService`, `SessionService`, `AuditService`, `BCVService`, `TasaCambioService`, `TasaSyncScheduler`, `FIFOService`.
- `src/controllers/AuthController.js` — auth, MFA, rehash de contraseñas, sin `dev_token`.
- `src/controllers/AdminController.js` — **nuevo** (gestión de usuarios).
- `src/controllers/PedidoController.js` — pagos (`monto_abonado` como total, validación `<= costo_total`, coherencia al crear).
- `src/controllers/ComprasController.js` — persiste `cantidad_comprada` al crear lista.
- `src/middleware/auth.js` — `authenticate` + `authorize`.
- `src/routes/admin.js` — **nuevo**; `src/routes/auth.js`, `src/routes/index.js`.
- `src/models/Usuario.js` — enum de roles + rol por defecto.
- `src/config/config.js` (bloque `mail`), `src/config/sequelizeConfig.js` (DB_ADMIN).
- `src/index.js` — estado SMTP + scheduler BCV.
- `scripts/backup-db.js`, `scripts/create-app-role.js`, `scripts/test-email.js` — **nuevos**.

### Web
- `web/index.html` — "Usuarios y Roles" (sidebar), vistas de Nueva Receta, Lista de Compra, Nuevo Ingrediente y editor de URL del servidor.
- `web/js/app.js` — panel admin, nueva receta, listas de compra, nuevo ingrediente, fechas locales, settings y lógica de pagos.

### Móvil
- `app/src/screens/profile/UsuariosScreen.js` — **nuevo** (gestión de usuarios).
- `app/src/screens/inventory/NuevoIngredienteModal.js` — **nuevo**.
- `app/src/screens/success/PedidoExitosoScreen.js` y `LoteExitosoScreen.js` — reescritos con datos reales.
- `app/src/screens/inventory/RegistrarLoteModal.js`, `ListaComprasScreen.js`, `components/ui/Modal.js` — manejo de teclado.
- `app/src/screens/dashboard/DashboardScreen.js`, `orders/OrdersScreen.js`, `clients/ClientsScreen.js`, `recipes/RecipesScreen.js`, `inventory/InventoryScreen.js` — refresco al enfocar.
- `app/src/lib/hooks/useData.js` — `refetch` con identidad estable.
- `app/src/screens/auth/*` (Login/Register/Reset) — sin token de desarrollo.
- `app/src/navigation/AppNavigator.js` — pantallas registradas / mock eliminado.

### Documentación
- `README.md` — documentación de auth, SMTP, base de datos, roles y respaldos.
- `INFORME_TECNICO.md` — este documento.

---

## 13. Recomendaciones de seguridad (antes de producción)

1. **Rotar todas las credenciales** listadas en la sección 9 (contraseñas de la app, `panqueo_app`, `postgres`, `JWT_SECRET`).
2. Cambiar las contraseñas sembradas (`admin123`) por contraseñas reales de 12+ caracteres.
3. Servir todo por **HTTPS** y activar `AUTH_COOKIE_SECURE=true` y `AUTH_ENFORCE_HTTPS=true`.
4. Configurar `APP_URL` con el dominio real (hoy apunta a `http://localhost:5500`).
5. Para correo en producción, valorar un proveedor transaccional (Brevo, Resend, SES) con dominio verificado y **SPF/DKIM/DMARC**. Gmail tiene límite de ~500 destinatarios/día.
6. Programar los respaldos (`npm run db:backup`) a diario y guardar una copia fuera de la máquina.
7. Mantener `DB_USER` como rol de mínimo privilegio (ya hecho) y no usar `postgres` en la app.

---

## 14. Cómo verificar rápidamente

```bash
cd PanQueo/backend
npm test                        # 155 tests
npm run mail:test -- tu@correo.com   # verifica SMTP
npm run db:backup -- --verify  # respaldo + restauración de prueba
```

Para ver el panel de usuarios: inicia sesión en la web con `admin@panqueo.com` (pedirá código MFA) o en la app móvil, y entra a **Perfil → Gestión de usuarios**.
