# 🧁 PanQueo — Contexto de desarrollo (HANDOFF)

> Este archivo es el **mapa de contexto vivo** del proyecto. Actualízalo al cerrar cada fase.
> Última actualización: 2026-10-22 — Fases 1, 2, 3.1–3.4 completadas y publicadas.

## Qué es PanQueo

Sistema de gestión para repostería ("Inversiones Dulsal Johanel C.A.") con 3 apps:

- **`PanQueo/web/`** — la app principal (HTML+CSS+JS vanilla) conectada al backend real.
- **`PanQueo/backend/`** — API Node+Express+Sequelize, **dual-dialecto: SQLite en dev, PostgreSQL en producción**.
- **`PanQueo/app/`** — React Native/Expo con datos mock (no es prioridad ahora).

## Cómo correr el entorno

```bash
cd PanQueo/backend && npm start          # API :3000 (sync auto de modelos en dev/SQLite)
cd PanQueo/backend/scripts && node serve_web.js   # Web estática :5500
cd PanQueo/backend && npm test           # 91/91 tests (jest)
# Ver web en: http://localhost:5500 (usar ?r=<n> para cache-busting de JS/CSS)
```

- Usuario de prueba (SQLite): `fase3@panqueo.test` / `Panqueo_2026`
- Tasa BCV vigente en dev: 42.5 Bs/USD
- Datos de prueba: ingredientes Harina F (lote vencido), Harina Prueba, Sal; pedidos #1–#5; pedido #1 En Cocina con FIFO consumido.

## Estado actual

| Fase | Alcance | Commit |
|------|---------|--------|
| Fases 1–2 | Backend robusto (FIFO idempotente, transacciones), suite de tests 91/91 | `76cd432` |
| 3.1 | Shell: sidebar escritorio, tokens dark/light, sheets, toasts, bimoneda | `aaa6910` |
| 3.2 | Inventario/recetas/perfil/settings real contra API | `02dcff3` |
| 3.3 | Pedidos multi-receta real + compras + consume FIFO | `56715ad` |
| 3.3 UX | Dark completo de contenido, modales full-screen en escritorio | `f8a8ddf` |
| 3.4 | Reportes (producción/mermas/trazabilidad FEFO) + calculadora de precios | `ca3f3e5` |
| — | Formulario calculadora integrado al tema + README | `86041ca` |

## Identidad visual (NO negociable)

- Amarillo `#ffc107`, marrón `#785900`, tipografías Inter + Poppins.
- Capibara `SPARKLE.png` (avatar), muffin `PANQUEO ICONO.png` (logo).
- **Prohibida** la paleta terracota de `web/Nueva Propuesta/` (esa carpeta es solo referencia de UX y **no se commitea**).

## Decisiones de arquitectura clave

1. **FIFO/FEFO**: al pasar pedido a "En Cocina" se consume por lote con vencimiento más antiguo; idempotente; el log queda en `consumos_lote` con auditoría de violaciones FEFO en `/reportes/trazabilidad`.
2. **Validación de stock del pedido nuevo va en el frontend** (cantidad × requerido > disponible); la API verifica solo 1 porción.
3. **Bimoneda** (`PQ_CURRENCY` en localStorage): modos dual/usd/bs + tasa BCV; todos los montos pasan por `fmtMoneyHTML`.
4. **Dark mode**: overrides de clases Tailwind del MVP en `web/css/shell.css` bajo `html.dark`; `color-scheme: dark` en la raíz.
5. **Vistas full-screen** en escritorio: envoltorio runtime `wrapFullScreenViews()` (`.fsv-panel` 680px con backdrop y back-header sticky).
6. Commits de git: autor `Samuel Jimenez <Samuel.ejimenez@hotmail.com>`, **mensajes sin acentos**, solo textos UI en español con acentos.

## Arreglos de bug recientes (conoce estos patrones)

- Los sheets se cierran con `display:none`/`.open` + animación (NO `opacity:0`) por bug de render fantasma.
- Shapes de respuesta: clientes (`data.clientes`) y listas (`data.listas`) NO son arrays directos — manejar ambos.
- No existe DELETE de pedidos ni de listas; "Completar" es idempotente.
- `apiFetch` normaliza `res.data`; JWT Bearer; `/api/health` y `/auth/*` públicos; CORS abierto.

## Pendiente (siguientes pasos)

1. **Elegir y configurar PostgreSQL gratuito de producción** (Neon / Supabase / servidor propio) y probar `npm run migrate` con la migración `20261020000001-create-consumos-lote.js`.
2. Redondear Fase 3: pulir lo que el usuario marque de diseño.
3. Reportes mejorables: exportar CSV, filtros de rango de fechas en producción/mermas, gráfico simple.
4. Pedidos #2/#3 quedaron en la DB dev por fallos de validación históricos — aceptados como datos de prueba.

## Cómo verificar cambios de frontend

- Refrescar con F5 o `?r=<n>`.
- El backend también reinicia al cambiar su código (`node src/index.js`).
- Screenshots: solo si la ventana del navegador es visible; si no, verificar por DOM (`getComputedStyle`).
