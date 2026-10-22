---
name: PanQueo Dev
description: Usa esta skill al iniciar CUALQUIER trabajo en el repositorio PanQueo (web, backend o mobile): carga el contexto del proyecto, convenciones de identidad, cómo correr los servidores y las reglas de commits.
---

# Contexto PanQueo

1. Lee `HANDOFF.md` en la raíz del repo ANTES de proponer cambios: contiene el estado del proyecto, decisiones de arquitectura y pendientes.
2. Nunca rompas la identidad visual: amarillo `#ffc107` / marrón `#785900`, Inter + Poppins, capibara `SPARKLE.png`. No uses la paleta terracota de `web/Nueva Propuesta/` (carpeta sin trackear).
3. Commits: autor `Samuel Jimenez <Samuel.ejimenez@hotmail.com>` (config local del repo), mensajes SIN acentos ni caracteres especiales.
4. Staging: usa `git add -A` y luego `git restore --staged "PanQueo/web/Nueva Propuesta/index.html"` si el editor la coleccionó.

## Entorno local

```bash
cd PanQueo/backend && npm start            # API :3000, SQLite en dev
cd PanQueo/backend/scripts && node serve_web.js  # Web :5500
npm test                                    # suite 91/91
```

- Ver la web con cache-busting: `http://localhost:5500/?r=<n>`
- Usuario demo: `fase3@panqueo.test` / `Panqueo_2026`, tasa 42.5.

## Reglas técnicas habilitadas por la base del proyecto

- Todo descuento de inventario pasa por `FIFOService` (FEFO por vencimiento, idempotente, con log en `consumos_lote`).
- La validación de stock del pedido nuevo se hace en el frontend multiplicando porción × cantidad.
- Los montos SIEMPRE se formatean con `fmtMoneyHTML` (bimoneda BCV, modos dual/usd/bs).
- Dark mode: añadir overrides de clases del MVP en `web/css/shell.css` bajo `html.dark`; no hardcodear colores claros.
- Sheets: cerrar con `display:none`/`.open` (nunca `opacity:0`); formas de respuesta de clientes/listas usan `data.clientes`/`data.listas`.
- Doble dialecto: SQLite dev (sync auto) y PostgreSQL prod (migraciones); cualquier tabla nueva necesita modelo + migración sin features específicas de un dialecto.
