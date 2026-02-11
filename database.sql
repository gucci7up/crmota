-- PARTE 1: BASE DE DATOS (SUPABASE / POSTGRESQL)

-- 1. Categorías de productos
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_min INTEGER NOT NULL DEFAULT 5,
    imagen_url TEXT,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    documento TEXT UNIQUE,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    notas TEXT,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'moroso')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Ventas (Cabecera)
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES auth.users(id),
    total DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    estado_pago TEXT DEFAULT 'pagado' CHECK (estado_pago IN ('pagado', 'pendiente', 'anulado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Detalle de Ventas
CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Compras (Proveedores)
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID REFERENCES proveedores(id),
    total DECIMAL(12,2) NOT NULL,
    estado TEXT DEFAULT 'completado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Gastos
CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion TEXT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    categoria TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Cuotas (Ventas a crédito)
CREATE TABLE cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    monto DECIMAL(12,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT, -- 'stock_bajo', 'cuota_vencida', etc
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. WhatsApp Logs
CREATE TABLE mensajes_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    mensaje TEXT NOT NULL,
    tipo TEXT, -- 'factura', 'recordatorio', 'promo'
    estado TEXT, -- 'enviado', 'entregado', 'fallido'
    sid_provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Profiles (Extensión de auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT,
    rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'cajero')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONFIGURACIÓN DE RLS (ROW LEVEL SECURITY)

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Lectura para todos los autenticados, Escritura para Admin/Vendedor)
CREATE POLICY "Lectura para todos los autenticados" ON categorias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Escritura para Admin" ON categorias ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

-- (Se añadirán más políticas específicas en la Parte 6 de seguridad avanzada)

-- 13. Historial de Pagos (Abonos)
CREATE TABLE historial_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
    cuota_id UUID REFERENCES cuotas(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES auth.users(id),
    monto DECIMAL(12,2) NOT NULL,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
    referencia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE historial_pagos ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "Lectura historial pagos" ON historial_pagos FOR SELECT USING (auth.role() = 'authenticated');
 CREATE POLICY "Escritura historial pagos" ON historial_pagos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

