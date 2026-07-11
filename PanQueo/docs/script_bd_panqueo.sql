-- ============================================================
-- SCRIPT COMPLETO DE BASE DE DATOS - PanQueo / SaborControl
-- PostgreSQL
-- ============================================================

-- 1. CREAR BASE DE DATOS (ejecutar como superusuario)
--    Descomentar la linea de abajo si se ejecuta desde psql
--    con permisos de superusuario.
-- ============================================================
-- CREATE DATABASE panqueo;
-- \c panqueo;

-- ============================================================
-- 2. CREAR ENUMs
-- ============================================================
DO $$ BEGIN
    CREATE TYPE enum_usuarios_rol AS ENUM ('admin', 'cocinero', 'vendedor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_pedidos_estado_pago AS ENUM ('Pendiente', 'Abonado', 'Pagado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_pedidos_estado_entrega AS ENUM ('Por Preparar', 'En Cocina', 'Listo', 'Entregado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_lotes_moneda AS ENUM ('Bs', 'USD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_lista_compras_estado AS ENUM ('Borrador', 'En Progreso', 'Completada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. CREAR TABLAS (ordenadas por dependencias de FK)
-- ============================================================

-- 3.1 PROVEEDORES
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3.2 USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol enum_usuarios_rol NOT NULL DEFAULT 'admin',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

-- 3.3 INGREDIENTES
CREATE TABLE IF NOT EXISTS ingredientes (
    id_ingrediente SERIAL PRIMARY KEY,
    nombre_ing VARCHAR(255) NOT NULL UNIQUE,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    unidad_medida VARCHAR(255) NOT NULL,
    id_proveedor INTEGER REFERENCES proveedores(id_proveedor)
        ON UPDATE CASCADE ON DELETE SET NULL,
    categoria VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingredientes_nombre ON ingredientes (nombre_ing);
CREATE INDEX IF NOT EXISTS idx_ingredientes_proveedor ON ingredientes (id_proveedor);
CREATE INDEX IF NOT EXISTS idx_ingredientes_categoria ON ingredientes (categoria);

-- 3.4 CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    cedula VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(255) NOT NULL,
    direccion TEXT,
    puntos_fidelidad INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes (cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes (telefono);

-- 3.5 RECETAS
CREATE TABLE IF NOT EXISTS recetas (
    id_receta SERIAL PRIMARY KEY,
    nombre_receta VARCHAR(255) NOT NULL UNIQUE,
    instrucciones TEXT,
    rendimiento VARCHAR(255),
    precio_sugerido DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recetas_nombre ON recetas (nombre_receta);

-- 3.6 RECETA_INGREDIENTES
CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id_receta_ing SERIAL PRIMARY KEY,
    id_receta INTEGER NOT NULL REFERENCES recetas(id_receta)
        ON UPDATE CASCADE ON DELETE CASCADE,
    id_ingrediente INTEGER NOT NULL REFERENCES ingredientes(id_ingrediente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad_requerida DECIMAL(10,2) NOT NULL CHECK (cantidad_requerida >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (id_receta, id_ingrediente)
);
CREATE INDEX IF NOT EXISTS idx_receta_ing_receta ON receta_ingredientes (id_receta);
CREATE INDEX IF NOT EXISTS idx_receta_ing_ingrediente ON receta_ingredientes (id_ingrediente);

-- 3.7 LOTES_INGREDIENTES
CREATE TABLE IF NOT EXISTS lotes_ingredientes (
    id_lote SERIAL PRIMARY KEY,
    id_ingrediente INTEGER NOT NULL REFERENCES ingredientes(id_ingrediente)
        ON UPDATE CASCADE ON DELETE CASCADE,
    cantidad_actual DECIMAL(10,2) NOT NULL CHECK (cantidad_actual >= 0),
    cantidad_inicial DECIMAL(10,2) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_venc DATE NOT NULL,
    precio_compra_unitario DECIMAL(10,2),
    moneda enum_lotes_moneda NOT NULL DEFAULT 'Bs',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_fecha_venc CHECK (fecha_venc > fecha_ingreso)
);
CREATE INDEX IF NOT EXISTS idx_lotes_ingrediente ON lotes_ingredientes (id_ingrediente);
CREATE INDEX IF NOT EXISTS idx_lotes_fecha_venc ON lotes_ingredientes (fecha_venc);
CREATE INDEX IF NOT EXISTS idx_lotes_fifo ON lotes_ingredientes (id_ingrediente, fecha_venc);

-- 3.8 PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_receta INTEGER REFERENCES recetas(id_receta)
        ON UPDATE CASCADE ON DELETE SET NULL,
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    monto_abonado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado_pago enum_pedidos_estado_pago NOT NULL DEFAULT 'Pendiente',
    estado_entrega enum_pedidos_estado_entrega NOT NULL DEFAULT 'Por Preparar',
    es_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    direccion_delivery TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos (id_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_receta ON pedidos (id_receta);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pago ON pedidos (estado_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_entrega ON pedidos (estado_entrega);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos (fecha_pedido);

-- 3.9 LISTA_COMPRAS
CREATE TABLE IF NOT EXISTS lista_compras (
    id_lista SERIAL PRIMARY KEY,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_lista enum_lista_compras_estado NOT NULL DEFAULT 'Borrador',
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lista_compras_estado ON lista_compras (estado_lista);

-- 3.10 DETALLE_LISTA_COMPRAS
CREATE TABLE IF NOT EXISTS detalle_lista_compras (
    id_detalle_lista SERIAL PRIMARY KEY,
    id_lista INTEGER NOT NULL REFERENCES lista_compras(id_lista)
        ON UPDATE CASCADE ON DELETE CASCADE,
    id_ingrediente INTEGER NOT NULL REFERENCES ingredientes(id_ingrediente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad_sugerida DECIMAL(10,2) NOT NULL,
    cantidad_comprada DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_estimado_unitario DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_detalle_lista ON detalle_lista_compras (id_lista);
CREATE INDEX IF NOT EXISTS idx_detalle_ingrediente ON detalle_lista_compras (id_ingrediente);

-- 3.11 HISTORIAL_TASA_CAMBIO
CREATE TABLE IF NOT EXISTS historial_tasa_cambio (
    id_tasa SERIAL PRIMARY KEY,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_bs_por_usd DECIMAL(10,4) NOT NULL,
    fuente_referencia VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasa_fecha ON historial_tasa_cambio (fecha_registro);

-- ============================================================
-- 4. DATOS DE PRUEBA (seeders)
-- ============================================================

-- 4.1 PROVEEDORES
INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES
    ('Distribuidora Central C.A.', 'Carlos Mendoza', '+58 212 555 0101', 'Av. Principal, Zona Industrial, Caracas'),
    ('Productos La Pastora', 'Maria Fernandez', '+58 241 555 0202', 'Calle 5, Valencia, Edo. Carabobo'),
    ('Importadora Los Andes', 'Jose Rivas', '+58 274 555 0303', 'Av. Bolivar, Merida');

-- 4.2 USUARIOS (password: admin123)
--    El hash bcrypt de 'admin123' es:
--    $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO usuarios (nombre, apellido, email, telefono, password, rol) VALUES
    ('Admin', 'PanQueo', 'admin@panqueo.com', '+58 412 000 0000',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
    ('Cocinero', 'Sprinkle', 'cocinero@panqueo.com', '+58 412 000 0001',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'cocinero'),
    ('Vendedor', 'Capibara', 'vendedor@panqueo.com', '+58 412 000 0002',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'vendedor');

-- 4.3 INGREDIENTES
INSERT INTO ingredientes (nombre_ing, stock_minimo, unidad_medida, id_proveedor, categoria) VALUES
    ('Harina de Trigo 0000', 10.00, 'kg', 1, 'Harinas'),
    ('Azucar Refinada', 15.00, 'kg', 1, 'Endulzantes'),
    ('Leche Entera', 10.00, 'L', 2, 'Lacteos'),
    ('Mantequilla sin Sal', 5.00, 'kg', 2, 'Lacteos'),
    ('Huevos de Campo', 50.00, 'unidades', 2, 'Huevos'),
    ('Chocolate Oscuro 70%', 3.00, 'kg', 3, 'Chocolates'),
    ('Esencia de Vainilla', 1.00, 'L', 3, 'Esencias'),
    ('Polvo de Hornear', 2.00, 'kg', 1, 'Levaduras');

-- 4.4 RECETAS
INSERT INTO recetas (nombre_receta, instrucciones, rendimiento, precio_sugerido) VALUES
    ('Pastel de Tres Leches',
     '1. Batir claras a punto de nieve. 2. Mezclar yemas con azucar. 3. Incorporar harina tamizada. 4. Hornear a 180C por 35 min. 5. Banar con mezcla de tres leches. 6. Refrigerar por 4 horas.',
     '1 pastel (12 porciones)', 25.00),
    ('Galletas de Chocolate',
     '1. Batir mantequilla con azucar. 2. Agregar huevo y vainilla. 3. Incorporar harina y chocolate. 4. Formar bolitas y hornear 15 min a 180C.',
     '24 galletas', 8.00),
    ('Pan de Mantequilla',
     '1. Disolver levadura en leche tibia. 2. Mezclar harina, mantequilla, huevo. 3. Amasar 10 min. 4. Dejar reposar 1 hora. 5. Hornear 25 min a 190C.',
     '2 panes grandes', 6.00);

-- 4.5 RECETA_INGREDIENTES
INSERT INTO receta_ingredientes (id_receta, id_ingrediente, cantidad_requerida) VALUES
    -- Pastel de Tres Leches
    (1, 1, 0.50),
    (1, 2, 0.40),
    (1, 3, 0.75),
    (1, 5, 4.00),
    (1, 7, 0.01),
    -- Galletas de Chocolate
    (2, 1, 0.30),
    (2, 2, 0.20),
    (2, 4, 0.15),
    (2, 5, 1.00),
    (2, 6, 0.20),
    -- Pan de Mantequilla
    (3, 1, 0.50),
    (3, 2, 0.05),
    (3, 3, 0.20),
    (3, 4, 0.10),
    (3, 5, 1.00);

-- 4.6 CLIENTES
INSERT INTO clientes (nombre, apellido, cedula, telefono, direccion, puntos_fidelidad) VALUES
    ('Maria', 'Garcia', 'V12345678', '+58 412 123 4567', 'Av. Principal, Edif. 5, Caracas', 120),
    ('Juan', 'Perez', 'V23456789', '+58 414 765 4321', 'Calle Sucre #45, Los Teques', 45),
    ('Ana', 'Martinez', 'V34567890', '+58 426 998 8776', 'Urb. Las Flores, Casa 12, Caracas', 280);

-- 4.7 LOTES_INGREDIENTES
INSERT INTO lotes_ingredientes (id_ingrediente, cantidad_actual, cantidad_inicial, fecha_ingreso, fecha_venc, precio_compra_unitario, moneda) VALUES
    (1, 25.00, 50.00, CURRENT_DATE - 30, CURRENT_DATE + 120, 1.50, 'Bs'),
    (2, 30.00, 40.00, CURRENT_DATE - 20, CURRENT_DATE + 180, 0.90, 'Bs'),
    (3, 15.00, 20.00, CURRENT_DATE - 10, CURRENT_DATE + 5,   2.00, 'Bs'),
    (4, 8.00,  10.00, CURRENT_DATE - 15, CURRENT_DATE + 60,  4.50, 'Bs'),
    (5, 120.00, 200.00, CURRENT_DATE - 7,  CURRENT_DATE + 20, 0.25, 'Bs'),
    (6, 5.00,  8.00,  CURRENT_DATE - 60, CURRENT_DATE + 240, 8.00, 'USD');

-- 4.8 PEDIDOS
INSERT INTO pedidos (id_cliente, id_receta, fecha_pedido, fecha_entrega, costo_total, monto_abonado, estado_pago, estado_entrega, es_delivery, direccion_delivery, observaciones) VALUES
    (1, 1, CURRENT_DATE - 2, CURRENT_DATE + 1, 25.00, 10.00, 'Abonado', 'En Cocina', FALSE, NULL, 'Sin chantilly'),
    (2, 2, CURRENT_DATE - 1, CURRENT_DATE,     8.00,  8.00,  'Pagado', 'Listo', TRUE, 'Calle Sucre #45, Los Teques', NULL),
    (3, 3, CURRENT_DATE,     CURRENT_DATE + 3, 6.00,  0.00,  'Pendiente', 'Por Preparar', FALSE, NULL, NULL);

-- 4.9 HISTORIAL_TASA_CAMBIO
INSERT INTO historial_tasa_cambio (fecha_registro, valor_bs_por_usd, fuente_referencia) VALUES
    (CURRENT_DATE - 7, 36.50, 'BCV'),
    (CURRENT_DATE - 2, 38.20, 'BCV'),
    (CURRENT_DATE,     40.00, 'BCV');

-- ============================================================
-- 5. VERIFICACION
-- ============================================================
SELECT 'BASE DE DATOS CREADA EXITOSAMENTE' AS mensaje;
SELECT 'Proveedores:'::text AS tabla, COUNT(*) AS registros FROM proveedores
UNION ALL SELECT 'Usuarios:', COUNT(*) FROM usuarios
UNION ALL SELECT 'Ingredientes:', COUNT(*) FROM ingredientes
UNION ALL SELECT 'Recetas:', COUNT(*) FROM recetas
UNION ALL SELECT 'Receta_Ingredientes:', COUNT(*) FROM receta_ingredientes
UNION ALL SELECT 'Clientes:', COUNT(*) FROM clientes
UNION ALL SELECT 'Lotes_Ingredientes:', COUNT(*) FROM lotes_ingredientes
UNION ALL SELECT 'Pedidos:', COUNT(*) FROM pedidos
UNION ALL SELECT 'Historial_Tasa:', COUNT(*) FROM historial_tasa_cambio;
