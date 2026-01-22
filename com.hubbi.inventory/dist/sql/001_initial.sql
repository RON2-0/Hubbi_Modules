-- =============================================
-- Módulo: com.hubbi.inventory
-- Versión: 3 (Schema-Isolated Tables)
-- Descripción: Esquema avanzado para gestión universal (B2B/B2C, Activos, Servicios, Multi-UOM).
-- NOTA: Este SQL se ejecuta dentro del esquema 'com_hubbi_inventory' automáticamente.
--       No es necesario usar prefijos en los nombres de tablas.
-- =============================================

-- 0. Tablas Maestras y Configuraciones Globales

-- 0.1 Unidades de Medida (UOM) Globales
CREATE TABLE IF NOT EXISTS uoms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- "Unidad", "Libra", "Caja 12"
    symbol TEXT NOT NULL, -- "u", "lb", "c12"
    is_active BOOLEAN DEFAULT TRUE
);

-- 0.2 Campos Personalizados Globales (Dynamic Fields)
CREATE TABLE IF NOT EXISTS custom_fields (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    key_name TEXT NOT NULL UNIQUE, -- "color", "material"
    type TEXT DEFAULT 'text', -- 'text', 'number', 'boolean', 'select', 'date'
    options JSON DEFAULT '[]',
    default_value TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 1. Catálogo Maestro de Productos y Activos
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    
    -- Clasificación Jerárquica
    category_id TEXT,
    group_id TEXT,
    subgroup_id TEXT,
    
    -- Tipología Principal
    type TEXT DEFAULT 'product', -- 'product', 'service', 'asset', 'kit'
    
    -- Unidades de Medida
    base_unit_id TEXT NOT NULL,
    purchase_unit_id TEXT,
    
    -- Banderas Operativas
    is_active BOOLEAN DEFAULT TRUE,
    is_saleable BOOLEAN DEFAULT TRUE,
    is_purchasable BOOLEAN DEFAULT TRUE,
    is_tax_exempt BOOLEAN DEFAULT FALSE,
    has_expiration BOOLEAN DEFAULT FALSE,
    has_warranty BOOLEAN DEFAULT FALSE,
    
    -- Datos Financieros
    cost_avg REAL DEFAULT 0,
    price_base REAL DEFAULT 0,
    accounting_account_id TEXT,
    tax_code_id TEXT,
    
    -- Atributos Dinámicos
    attributes JSON DEFAULT '{}',
    asset_meta JSON DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (base_unit_id) REFERENCES uoms(id)
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);

-- 1.1 Unidades de Medida Alternativas por Ítem
CREATE TABLE IF NOT EXISTS item_uoms (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    uom_id TEXT NOT NULL,
    
    conversion_factor REAL NOT NULL,
    sale_price REAL,
    barcode TEXT,
    
    is_default_sale BOOLEAN DEFAULT FALSE,
    
    UNIQUE(item_id, uom_id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (uom_id) REFERENCES uoms(id)
);

-- 1.2 Proveedores por Ítem
CREATE TABLE IF NOT EXISTS item_suppliers (
    item_id TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    
    supplier_sku TEXT,
    last_cost REAL,
    lead_time_days INTEGER,
    
    is_preferred BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (item_id, supplier_id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 2. Ubicaciones (Locations)
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'warehouse', 'zone', 'rack', 'shelf', 'bin'
    
    wms_meta JSON DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Existencias (Stock)
CREATE TABLE IF NOT EXISTS stock (
    item_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    
    quantity REAL DEFAULT 0,
    
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    alert_threshold REAL,
    
    last_count TIMESTAMP,
    
    PRIMARY KEY (item_id, location_id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_item ON stock(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);

-- 4. Historial de Movimientos (Kardex)
CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'TRANSFER', 'CONSUME'
    reason TEXT,
    
    from_location_id TEXT,
    to_location_id TEXT,
    
    quantity REAL NOT NULL,
    uom_id TEXT,
    
    cost_at_moment REAL,
    reference_doc TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Kits / Bill of Materials
CREATE TABLE IF NOT EXISTS kits (
    parent_item_id TEXT NOT NULL,
    child_item_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    
    PRIMARY KEY (parent_item_id, child_item_id)
);

-- 6. Trazabilidad (Seriales & Lotes)
CREATE TABLE IF NOT EXISTS serials (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    lot_number TEXT,
    
    current_location_id TEXT,
    status TEXT DEFAULT 'available',
    
    expiration_date TIMESTAMP,
    production_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(item_id, serial_number)
);

-- 7. Transferencias
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    from_hub_id TEXT,
    to_hub_id TEXT,
    requester_id TEXT,
    status TEXT DEFAULT 'pending',
    items JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
