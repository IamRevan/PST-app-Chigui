# PanQueo — Backend API

API REST del sistema **PanQueo** para gestión de inventario y producción de repostería.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js + Express |
| ORM | Sequelize |
| Base de Datos | PostgreSQL |
| Autenticación | JWT (jsonwebtoken + bcryptjs) |

## Requisitos Previos

- [Node.js](https://nodejs.org) v18 o superior
- [PostgreSQL](https://www.postgresql.org/download/) v15 o superior corriendo en `localhost:5432`

## Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Editar `.env` y cambiar `DB_PASSWORD` con tu contraseña de PostgreSQL:
```env
DB_PASSWORD=<tu_contraseña>
```

### 3. Crear la base de datos, tablas y datos de prueba
```bash
npm run setup
```

Esto ejecuta automáticamente:
1. `db:create` → Crea la base de datos `panqueo`
2. `migrate` → Crea las 11 tablas
3. `seed` → Inserta datos de prueba

### 4. Iniciar el servidor
```bash
npm run dev       # Modo desarrollo (con recarga automática)
npm run start     # Modo producción
```

El servidor queda disponible en: **http://localhost:3000**

---

## Comandos de Base de Datos

| Comando | Descripción |
|---------|-------------|
| `npm run setup` | ⭐ Primera vez: crear + migrar + sembrar |
| `npm run db:reset` | Reinicio total (drop + create + migrate + seed) |
| `npm run db:create` | Solo crear la BD vacía |
| `npm run migrate` | Ejecutar migraciones pendientes |
| `npm run migrate:undo` | Revertir todas las migraciones |
| `npm run seed` | Insertar datos de prueba |
| `npm run seed:undo` | Revertir seeders |

---

## Estructura del Proyecto

```
backend/
├── .env                    # Variables de entorno (NO subir al repo)
├── .env.example            # Plantilla de variables de entorno
├── .sequelizerc            # Configuración de rutas Sequelize CLI
├── package.json
├── scripts/
│   └── setup-db.js         # Script de configuración de BD
└── src/
    ├── index.js            # Punto de entrada
    ├── app.js              # Configuración Express
    ├── config/
    │   ├── config.js       # Config general
    │   ├── database.js     # Conexión Sequelize
    │   └── sequelizeConfig.js  # Config para CLI (dev/test/prod)
    ├── migrations/         # 11 migraciones ordenadas
    ├── seeders/            # 9 seeders con datos de prueba
    ├── models/             # Modelos Sequelize
    ├── controllers/        # Lógica de controladores
    ├── routes/             # Definición de endpoints
    ├── services/           # Lógica de negocio (FIFO, transacciones)
    └── middleware/         # Auth JWT, manejo de errores
```

---

## Usuarios de Prueba (Seeders)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@panqueo.com` | `admin123` | admin |
| `cocinero@panqueo.com` | `admin123` | cocinero |
| `vendedor@panqueo.com` | `admin123` | vendedor |

---

## Endpoints Base (MVP)

```
POST   /api/auth/login
GET    /api/clientes
POST   /api/clientes
GET    /api/pedidos
POST   /api/pedidos
PATCH  /api/pedidos/:id/estado
GET    /api/inventario/alertas
GET    /api/finanzas/tasas/actual
POST   /api/finanzas/tasas
```

Formato de respuesta estándar:
```json
// Éxito
{ "status": "success", "data": { ... } }

// Error
{ "status": "error", "message": "Descripción legible" }
```

---

## Documentación

- [Diagrama ER](../docs/DIAGRAMA_ER.md) — Modelo de base de datos
- [Script SQL](../docs/script_bd_panqueo.sql) — Script alternativo sin migraciones
- [Documento Maestro](../../Documento%20de%20desarrollo%20Maestro%20My%20peaplo%20Toasty.md) — Especificación técnica completa
