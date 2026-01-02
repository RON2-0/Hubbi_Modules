-- 1. Catálogo Maestro de Productos
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_items (
    id TEXT PRIMARY KEY, -- UUID
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT, -- Código de barras (puede ser diferente al SKU)
    name TEXT NOT NULL,
    description TEXT,
    
    -- Media
    image_url TEXT, -- URL or path to product image
    
    -- Clasificación
    category_id TEXT,
    group_id TEXT, -- Foreign key to product_groups
    brand TEXT,
    model TEXT,
    
    -- Comportamiento del Ítem
    type TEXT DEFAULT 'simple', -- 'simple', 'kit', 'serialized', 'service', 'asset'
    status TEXT DEFAULT 'available', -- 'available', 'reserved', 'damaged', 'expired', 'discontinued'
    
    -- Unidad de medida principal
    primary_unit TEXT DEFAULT 'unit', -- 'unit', 'box', 'kg', 'l', etc.
    allow_decimals BOOLEAN DEFAULT FALSE, -- TRUE = permet 0.5, FALSE = solo enteros
    
    -- Precios
    price_base REAL DEFAULT 0, -- Precio de venta base
    price_list JSON DEFAULT '[]', -- Lista de precios múltiples: [{"name": "Mayoreo", "price": 10.00}]
    tax_rate REAL DEFAULT 0.13, -- IVA por defecto El Salvador 13%
    is_tax_exempt BOOLEAN DEFAULT FALSE, -- TRUE = producto exento de IVA
    
    -- Costeo (Algoritmo Promedio Ponderado)
    weighted_average_cost REAL DEFAULT 0, -- Se recalcula en cada entrada
    last_cost REAL DEFAULT 0, -- Último costo de compra registrado
    
    -- Atributos Flexibles (VIN, Lote, Vencimiento, etc.)
    attributes JSON DEFAULT '{}',
    
    -- Control interno
    is_active BOOLEAN DEFAULT TRUE,
    is_internal_use_only BOOLEAN DEFAULT FALSE, -- Si es TRUE, no se muestra en ventas
    allow_negative_stock BOOLEAN DEFAULT FALSE, -- Si es TRUE, permite vender sin existencias
    
    -- Conteo cíclico
    abc_class TEXT DEFAULT 'C', -- 'A', 'B', 'C' para clasificación ABC
    cyclic_count_frequency TEXT, -- 'daily', 'weekly', 'monthly', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ubicaciones (Bodegas, Zonas, Estantes, Camiones)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT, -- Para jerarquía (Bodega -> Pasillo -> Estante)
    kind TEXT DEFAULT 'warehouse', -- 'warehouse', 'shelf', 'bin', 'truck', 'virtual'
    
    -- Contact Information (for warehouses)
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    manager_id TEXT, -- User ID of responsible person
    manager_name TEXT, -- Cached name for display
    
    -- Metadata
    sub_hub_id TEXT, -- Which branch owns this location
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Existencias (Stock Físico)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_stock (
    item_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    
    quantity REAL DEFAULT 0,
    
    -- Gestión de niveles
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    reorder_point REAL DEFAULT 0,
    
    -- Auditoría de conteo
    last_count_at TIMESTAMPTZ, 
    
    PRIMARY KEY (item_id, location_id),
    FOREIGN KEY (item_id) REFERENCES com_hubbi_inventory_items(id),
    FOREIGN KEY (location_id) REFERENCES com_hubbi_inventory_locations(id)
);

-- 4. Reservas Internas (Anti-Fuga de Stock)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_reservations (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    
    quantity REAL NOT NULL,
    
    -- Contexto de la reserva
    reference_type TEXT NOT NULL, -- 'work_order', 'transfer_out', 'sale_hold'
    reference_id TEXT NOT NULL,   -- ID de la Orden de Trabajo, Venta, etc.
    
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Opcional, liberación automática
    
    status TEXT DEFAULT 'active' -- 'active', 'consumed', 'cancelled'
);

-- 5. Historial de Movimientos (Kardex Auditado)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_movements (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'TRANSFER_IN', 'TRANSFER_OUT'
    reason TEXT, -- 'purchase', 'sale', 'internal_use', 'correction', 'initial_load'
    
    quantity REAL NOT NULL,
    
    -- Valores para contabilidad
    cost_at_moment REAL, -- Costo unitario en el momento del movimiento
    total_value REAL,    -- quantity * cost_at_moment
    
    -- Referencias Legales / Documentales
    document_type TEXT, -- 'invoice', 'credit_fiscal', 'remission_note'
    document_number TEXT,
    document_uuid TEXT, -- UUID del DTE si aplica
    
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Fiscal Period
    period_id TEXT, -- References hubbi_fiscal_periods(id)
    
    sub_hub_id TEXT -- Para filtrado multi-sucursal
);

-- 6. Kits / Recetas (BOM)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_kits (
    parent_item_id TEXT NOT NULL,
    child_item_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    PRIMARY KEY (parent_item_id, child_item_id)
);

-- 7. Lotes y Series (Trazabilidad Específica)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_traces (
    id TEXT PRIMARY KEY, -- Serial Number o Lote ID
    item_id TEXT NOT NULL,
    
    kind TEXT NOT NULL, -- 'serial', 'batch'
    
    value TEXT NOT NULL, -- El número de serie o código de lote real
    
    expiration_date TIMESTAMPTZ, -- Solo para lotes
    manufacturing_date TIMESTAMPTZ,
    
    cost_specific REAL, -- Costo específico de este serial/lote (override del promedio)
    
    status TEXT DEFAULT 'available', -- 'available', 'sold', 'damaged', 'reserved'
    current_location_id TEXT
);

-- 8. Auditorías Físicas (Snapshots)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_audits (
    id TEXT PRIMARY KEY,
    location_id TEXT, -- Si es null, es auditoría general
    started_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- 'open', 'reviewing', 'closed'
    created_by TEXT
);

CREATE TABLE IF NOT EXISTS com_hubbi_inventory_audit_lines (
    audit_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    
    expected_qty REAL NOT NULL, -- Snapshot del sistema al iniciar
    counted_qty REAL,           -- Lo que contó el humano
    difference REAL,            -- Calculado
    
    notes TEXT,
    PRIMARY KEY (audit_id, item_id)
);

-- 9. Proveedores
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_suppliers (
    id TEXT PRIMARY KEY, -- UUID generated in application code for cross-DB compatibility
    hub_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices Clave
CREATE INDEX IF NOT EXISTS com_hubbi_inventory_idx_stock_location ON com_hubbi_inventory_stock(location_id);
CREATE INDEX IF NOT EXISTS com_hubbi_inventory_idx_movements_item ON com_hubbi_inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS com_hubbi_inventory_idx_movements_date ON com_hubbi_inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS com_hubbi_inventory_idx_reservations_ref ON com_hubbi_inventory_reservations(reference_id);
CREATE INDEX IF NOT EXISTS com_hubbi_inventory_idx_suppliers_name ON com_hubbi_inventory_suppliers(name);
