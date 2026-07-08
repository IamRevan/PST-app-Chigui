13/6/26, 15:46 

Consolidaci6n de Documentos de Desarrollo ~~-~~ Google Gemini 

## DOCUMENTO MAESTRO DE DESARROLLO Y ESPECIFICACION TECNICA 

## Proyecto: SaborControl (Inversiones Dulsal Johanel C.A.) 

Version: 11 Fecha: Mayo 2026 Ubicacion: Caracas, Venezuela 

## 1. INFORMACION GENERAL DEL PROYECTO 

- e Nombre del Proyecto: Implementar un Sistema de Gestion de Inventario mediante una Aplicacion Mévil para el Control de Productos Perecederos y Procesos de Produccion en la Empresa Inversiones Dulsal Johanel C.A. 

- e Nombre Clave del Sistema: SaborControl 

- e Organizaci6on Beneficiaria: Inversiones Dulsal Johanel C.A. (CEO: Johana Corona) 

- e Equipo Investigador/ Desarrollador: Fabiana Rodriguez, Mariangel Ortiz, Yeismar Ruiz, Samuel Jimenez, Roiner Martinez. 

- e Tutor Académico: Misley Baute (UNETI). 

- e Metodologia de Desarrollo: Scrum y Kanban. 

- e Marco Legal: Constitucién de la Republica Bolivariana de Venezuela (Art. 110), LOCTI (Art. 1, 28, 19), Ley Especial contra los Delitos Informaticos (Art. 1). 

## 2. INTRODUCCION Y ALCANCE 

El sistema SaborControl tiene como proposito resolver la gesti6n operativa, el control de inventario por lotes con criticidad de vencimiento y la administracion del ciclo de vida de los pedidos para la microempresa de reposteria. La iniciativa nace de la necesidad de sustituir aplicaciones genéricas por una herramienta adaptada a sus requerimientos. 

El sistema funcionara bajo una arquitectura hibrida optimizada para entornos con conectividad intermitente (cocinas), permitiendo una interfaz movil fluida y una persistencia de datos relacional robusta. Esto reducira pérdidas econdomicas, optimizara la produccidony facilitara la toma de decisiones en tiempo real. 

## 3. ARQUITECTURA DE SOFTWARE Y STACK TECNOLOGICO 

El sistema implementa un estilo arquitectonico Cliente-Servidor de N-Capas (N-Tier) enfocado en la separacion estricta de responsabilidades, complementado con una Arquitectura Hibrida (Online/Offline). 

- e Capa de Presentacion (Frontend Movil): Construida en React Native con Expo. Garantiza portabilidad (Android/iOS). Interfaz minimalista optimizada para entornos de cocina, usando @react ~~-~~ navigation/native (Bottom Tabs) y axios . 

https://gemi ~~n~~ i.goo ~~gl~~ e.com/u/1/app/11f8a443d06dc215?hl=es&pageld=none 

1/7 

13/6/26, 15:46 

Consolidaci6n de Documentos de Desarrollo ~~-~~ Google Gemini 

- e Capa de Logica de Negocio (Backend API REST): Disefiada en Node.js con Express. Estructurada bajo el patron MVC (Rutas, Controladores, Servicios). 

- e Capa de Acceso a Datos (Persistencia): Administrada mediante el ORM Sequelize conectado a un motor de base de datos PostgreSQL. 

- e Estrategia de Despliegue: Funcionalidad offline/local (Intranet) con capacidad de sincronizacion a la Nube (ej. Supabase). No se dependera de servicios de terceros de pago exclusivos en el cddigo. 

## 4. CRITERIOS Y ATRIBUTOS DE DISENO 

1. Usabilidad y Simplicidad: Uso en entorno de cocina (manos ocupadas, presidon). Interfaces simples, textos grandes, navegacion minima. 

2. Modularidad y Bajo Acoplamiento: Mddulos independientes (Compra, Stock, Pedidos) comunicados via API REST. 

3. Escalabilidad y Mantenibilidad: Arquitectura en capas que permite afadir funciones (reportes, multi-usuario) sin reestructurar la base. 

4. Confiabilidad e Integridad Transaccional: Uso obligatorio de transacciones atomicas para evitar inconsistencias de inventario. 

5. Eficiencia: Tiempos de respuesta rapidos basados en base de datos normalizada (3FN) y ORM. 

## 5. ESPECIFICACION DE REQUISITOS DEL SISTEMA 

## Requisitos Funcionales (RF) 

- e RF-01 Gestion de Inventario: Registro, consulta y control de materias primas. Seguimiento por lote (cantidad, unidad, almacenamiento, fechas de compra y caducidad). 

- e RF-O2 Planificacion de Compras: Gestion de listas de compras previas a la adquisicion. 

- e RF-03 Control Multimoneda: Registro de precios en Bs. y USD, con historial de tasa de cambio adaptado al contexto nacional. 

- e RF-04 Gestion de Recetas: Plantillas reutilizables de produccion asociadas a ingredientes y cantidades. 

- ¢ RF-05 Control de Producci6n y Stock: Ordenes de produccién con descuento automatico y atomico de materias primas del stock activo basado en la receta. 

- e RF-06 Gestion de Pedidos y Clientes: Control interno de ventas, calculo de costos, gastos, ganancia y balances (sin mddulo fiscal/facturacion). 

- e RF-07 Generacion de Reportes: Reportes moviles sobre produccién, mermas por vencimiento y balance de pedidos. 

- e RF-08 Sistema de Notificaciones: Alertas de criticidad para productos proximos a vencer (< 7 dias). 

## Requisitos No Funcionales (RNF) 

- e RNF-01 Usabilidad: Interfaces adaptadas al contexto de cocina. 

https://gemi ~~n~~ i.goo ~~gl~~ e.com/u/1/app/11f8a443d06dc215?hl=es&pageld=none 

2/7 

13/6/26, 15:46 

Consolidaci6n de Documentos de Desarrollo ~~-~~ Google Gemini 

- e RNF-O2 Portabilidad: React Native (iOS/Android unificados). 

- e RNF-O3 Integridad Transaccional: Garantia ACID en PostgreSQL. 

- e RNF-04 Disponibilidad Offline: Capacidad hibrida y sincronizacion diferida. 

- e RNF-05 Rendimiento: Consultas optimizadas. e RNF-06 Mantenibilidad: Codigo modular, N-Tier. 

## 6. MODULOS FUNCIONALES DETALLADOS 

## 6.1. Médulo de Clientes y Control Interno de Pedidos 

- ¢ Gestion de Clientes: Registro y actualizacion. La cédula es el identificador unico. Historial dinamico de preferencias para sugerencias. 

- e Control de Pedidos: * Estados Financieros: "Pendiente", "Abonado", "Pagado". Calculo dinamico: balance ~~_~~ pendiente = costo ~~_~~ total ~~-~~ monto ~~_~~ abonado. 

   - e Estados Operativos: "Por Preparar", "En Cocina", "Listo", "Entregado". 

   - e Delivery: Control de direcciones y flag es ~~_~~ delivery . 

## 6.2. Modulo de Inventario y Control de Lotes Perecederos 

- e Estructura FIFO (First In, First Out): El consumo prioriza el lote conla fecha ~~_~~ venc mas proxima. 

- e Trazabilidad y Mermas: Registro de proveedores y modulo de ajuste para conteo ciclico (stock tedrico vs. real). 

- e Alertas de Criticidad: Servicio que dispara alertas visuales para lotes a < 7 dias de caducar. 

## 6.3. Modulo de Produccion y Recetas 

- e Descuento Automatizado (Core Fuerte): Al pasar un pedido a estado "En Cocina", se ejecuta una transaccion atomica que resta los ingredientes fisicos de los lotes segun la receta. 

- e Simulador de Costos: Calculo del costo unitario basado en el precio de compra. 

## 6.4. Médulo de Intelligencia Operativa (Asistente) 

- e Prediccion de Compra: (Consumo Promedio Diario * 7 dias) ~~-~~ Stock Actual . e Deteccion de Anomalias: Alerta de desperdicio si el consumo real excede en >20% a la receta original. 

- e Recomendacion de Precios: Alertas si el margen de ganancia cae por debajo del 20% esperado. 

## 6.5. Modulo de Planificacién de Compras (Gestio6n RF-02) 

- e Listas de Compras Inteligentes: Creacidn de listas previas a la ida al mercado. Pueden ser alimentadas manualmente o autogeneradas por el Modulo de Inteligencia Operativa basandose en el stock minimo. 

- e Transicion de Estados: Las listas manejan estados: "Borrador", "En Progreso" (durante la compra) y "Completada". 

https://gemi ~~n~~ i.goo ~~gl~~ e.com/u/1/app/11f8a443d06dc215?hl=es&pageld=none 

3/7 

13/6/26, 15:46 

Consolidacién de Documentos de Desarrollo - Google Gemini 

- e Puente a Inventario: Al marcar una lista como "Completada”, el sistema debe facilitar la creacion agilde LOTES ~~_~~ INGREDIENTES basandose en los items comprados. 

## 6.6. Médulo de Control Multimoneda y Finanzas (Gestién RF-03) 

- ¢ Gestion Historica de Tasas: Registro y almacenamiento inmutable de las tasas de cambio (BCV u otra referencia) con marca de tiempo. 

- e Calculo Dual Automatico: Capacidad del sistema para mostrar costos de producci6on, gastos y totales de pedidos tanto en moneda base (Bs.) como en moneda fuerte (USD) consultando la ultima tasa activa. 

## 7. DISENO LOGICO DE LA BASE DE DATOS (ESQUEMA 3FN) 

Los modelos de Sequelize deben respetar los siguientes nombresy tipos de datos de forma estricta. 

## Relaciones Principales: 

- e CLIENTES (1)--->(N) PEDIDOS 

- e RECETAS (1) --->(N) RECETA ~~_~~ INGREDIENTES 

- e INGREDIENTES (1)--->(N) RECETA ~~_~~ INGREDIENTES 

- e INGREDIENTES (1) ---> (N) LOTES ~~_~~ INGREDIENTES 

- ¢ LIST ~~A_~~ COMPRAS (1) --->(N) DETALLE ~~_~~ LISTA ~~_~~ COMPRAS ¢ INGREDIENTES (1) --->(N) DETALLE ~~_~~ LISTA ~~_~~ COMPRAS 

## Estructura de Tablas: 

## 1. CLIENTES 

- e id ~~c~~ liente : INT, PK, Autolncrement. 

- e nombre : STRING, NOT NULL. 

- e apellido : STRING, NOT NULL. e cedula : STRING, UNIQUE, NOT NULL. e telefono : STRING, NOT NULL. 

- e direccion : TEXT, NULL. e puntos ~~_~~ fidelidad : INT, DEFAULT 0. 

## 2. PEDIDOS 

- e id ~~_~~ pedido : INT, PK, Autolncrement. e id ~~_~~ cliente : INT, FK (ON DELETE RESTRICT). 

- e fecha ~~_~~ pedido : DATE, DEFAULT NOW. 

- e fecha ~~_~~ entrega : DATE, NOT NULL. * costo ~~_~~ total : DECIMAL(10,2), NOT NULL. 

- e monto ~~_~~ abonado : DECIMAL(10,2), DEFAULT 0.00. 

- e estado ~~_~~ pago : ENUM ('Pendiente’, 'Abonado’, 'Pagado'), NOT NULL. 

https://gemi ~~n~~ i.goog ~~l~~ e.com/u/1/app/11f8a443d06dc215?hI=es&pageld=none 

AIT 

13/6/26, 15:46 

Consolidacién de Documentos de Desarrollo - Google Gemini 

- e estado ~~_~~ entrega : ENUM('Por Preparar', 'En Cocina’, 'Listo’, 'Entregado'), NOT NULL. e es ~~_~~ delivery : BOOLEAN, DEFAULT FALSE. e observaciones : TEXT, NULL. 

3. INGREDIENTES 

- e id ~~_~~ ingrediente : INT, PK, Autolncrement. e nombre ~~_~~ ing : STRING, UNIQUE, NOT NULL. e = stock ~~_~~ minimo : DECIMAL(10,2), NOT NULL. 

- e unidad ~~_~~ medida : STRING, NOT NULL. e id ~~_~~ proveedor : INT, NULL. (Para trazabilidad segun doc 2) 

## 4. LOTES_INGREDIENTES 

- e id ~~_~~ lote : INT, PK, Autolncrement. e id ~~_~~ ingrediente : INT, FK (ON DELETE CASCADE). 

- cantidad ~~_~~ actual : DECIMAL(10,2), NOT NULL. 

- e fecha ~~_~~ ingreso : DATE, NOT NULL. e fecha ~~_~~ venc : DATE, NOT NULL. 

5. RECETAS 

- e id ~~_~~ receta : INT, PK, AutolIncrement. e nombre ~~_~~ receta : STRING, UNIQUE, NOT NULL. e instrucciones : TEXT, NULL. 

## 6. RECETA_INGREDIENTES 

- e id ~~_~~ receta ~~_~~ ing : INT, PK, Autolncrement. e id ~~_~~ receta : INT, FK (ON DELETE CASCADE). 

- e id ~~_~~ ingrediente : INT, FK (ON DELETE RESTRICT). * cantidad ~~_~~ requerida : DECIMAL(10,2), NOT NULL. 

(Nota para el equipo de Desarrollo: Segun el RF-O2 y RF-03 del FAV, posteriormente deberan modelarse tablas adicionales como LISTA ~~_~~ COMPRAS e HISTORIAL ~~_T~~ ASA ~~_C~~ AMBIO_ siguiendo las mismas reglas 3FN). 

## --- EXPANSION DE MODELOS SEGUN NOTA RF-02 / RF-03 --- 

7. HISTORIAL_TASA_CAMBIO (Cumple RF-03) 

- e id ~~_~~ tasa :INT, PK, Autolncrement. e fecha ~~_~~ registro : DATE, NOT NULL, DEFAULT NOW. * valor ~~_~~ bs ~~_~~ por ~~_~~ usd : DECIMAL(10,4), NOT NULL. e fuente ~~_~~ referencia : STRING, NULL (gj. 'BCV’'). 

8. LISTA_COMPRAS (Cumple RF-02) 

- e id ~~_~~ lista : INT, PK, Autolncrement. e fecha ~~_~~ creacion : DATE, DEFAULT NOW. 

https://gemi ~~n~~ i.goog ~~l~~ e.com/u/1/app/11f8a443d06dc215?hI=es&pageld=none 

5/7 

13/6/26, 15:46 

Consolidaci6n de Documentos de Desarrollo ~~-~~ Google Gemini 

- e estado ~~_~~ lista : ENUM(‘Borrador', 'En Progreso’, 'Completada'), DEFAULT 'Borrador'. e observaciones : TEXT, NULL. 

## 9. DETALLE_LISTA_COMPRAS (Cumple RF-02 y normalizacion 3FN) 

- e id ~~_~~ detalle lista : INT, PK, Autolncrement. e id ~~_~~ lista :INT, FK (ON DELETE CASCADE). e id ~~_~~ ingrediente : INT, FK (ON DELETE RESTRICT). e cantidad ~~_~~ sugerida : DECIMAL(10,2), NOT NULL. * cantidad ~~_~~ comprada : DECIMAL(10,2), DEFAULT 0.00. * precio ~~_~~ estimado ~~_~~ unitario : DECIMAL(10,2), NULL. 

8. REGLAS DE NEGOCIO Y LOGICA DE BACKEND (ESTRICTAS) 1. Transaccionalidad en Descuentos: Toda operacion de actualizacién de pedido a "En Cocina" debe usar sequelize.transaction() . 

2. Algoritmo FIFO: Las consultas de consumo deben ordenarse mediante ORDER BY fecha ~~_~~ venc ASC . Siunlote no cubre la cantidad de la receta, se extrae su totalidad (colocando cantidad ~~_~~ actual a0) yelrestante se resta del siguiente lote en la lista. 

3. Prevencidn de Stock Negativo (Rollback): Si al iterar los lotes, la suma fisica total no cubre el requerimiento de la receta, el sistema ejecutara un transaction.rollback() de inmediato, retornando HTTP 400 ("Stock insuficiente"). 

4. Validacion de Fechas: Impedir el registroen BD si fecha ~~_~~ venc < fecha ~~_~~ ingreso. 

5. Anomalias de Merma: Si un ajuste manual de inventario o reporte de consumo excede en mas de 20% la cantidad tedrica de la receta, se debe registrar el incidente en un log operativo (base para RF-07). 

6. Tasa de Cambio Vigente (Multi-moneda): Para todo calculo dinamico que requiera conversion a Bolivares o Dolares en la interfaz movil, el backend debe proveer o consultar de manera inyectada el ultimo registro activo en HISTORIAL ~~_~~ TASA ~~_~~ CAMBIO filtrando por ORDER BY fecha ~~_~~ registro DESC LIMIT 1. 

7. Integridad de Lista de Compras (3FN): No se guarda un total calculado directo en la tabla LISTA ~~_~~ COMPRAS . El costo proyectado de una lista debe calcularse en tiempo de ejecucion 

(Backend 0 Frontend) sumando (cantidad ~~_~~ sugerida * precio ~~_~~ estimado ~~_u~~ nitario) desde DETALLE ~~_~~ LISTA ~~_~~ COMPRAS . 

## 9. CONTRATOS API REST 

- El formato de respuesta JSON es de cumplimiento obligatorio para todo controlador de Express: 

- e Exito (200 OK/201Created): { "status": "success", "data": { ... } } e Error (400, 404,500): { "status": "error", "message": "Descripcidén legible para el usuario" } 

- Endpoints Base Minimos: e Clientes: POST /api/clientes , GET /api/clientes?search=query , GET /api/clientes/:id/historial 

## Endpoints Base Minimos: 

https://gemi ~~n~~ i.goo ~~gl~~ e.com/u/1/app/11f8a443d06dc215?hl=es&pageld=none 

6/7 

13/6/26, 15:46 

Consolidacién de Documentos de Desarrollo ~~-~~ Google Gemini 

- e Pedidos: POST /api/pedidos , PATCH /api/pedidos/:id/estado 

- ¢ Inventario: GET /api/inventario/alertas (Filtra fecha ~~_~~ venc < 7dias) 

- e Asistente Inteligente: GET /api/asistente/prediccion ~~-c~~ ompra , GET /api/asistente/sugerencias ~~-~~ precios 

## Nuevos Endpoints (Modulos de Compra y Finanzas): 

- e Tasas de Cambio: 

   - e GET /api/finanzas/tasas/actual (Devuelve el ultimo registro valido). 

   - e POST /api/finanzas/tasas (Registra la tasa del dia). 

- e Lista de Compras: 

   - e POST /api/compras/listas (Crea un encabezado de lista y sus detalles en bulk). e GET /api/compras/listas?estado=Borrador (Consulta de listas activas o historicas). 

## 10. ESTANDARES DE CALIDAD Y SEGURIDAD 

El ciclo de desarrollo y el producto final estaran regulados por los siguientes estandares internacionales: 

- e ISO/IEC 25010: Garantia de calidad del producto (Funcionalidad, Usabilidad, Confiabilidad). 

- e IEEE 830: Especificacion clara, verificable y trazable de todos los requisitos de software. 

- e ISO/IEC 12207: Estructura de las fases del ciclo de vida del software (desde el levantamiento hasta la entrega). 

- e ISO/IEC 27001: Seguridad de la informacion, asegurando accesos autenticados y comunicacion cifrada (HTTPS) entre el frontend de React Native y el servidor Nodejs. 

https://gemi ~~n~~ i.goo ~~gl~~ e.com/u/1/app/11f8a443d06dc215?hl=es&pageld=none 

7/7 

