-- =============================================
-- Módulo: com.hubbi.inventory
-- Versión: 1 (Unified Development Schema)
-- Descripción: Esquema avanzado para gestión universal (B2B/B2C, Activos, Servicios, Multi-UOM).
-- NOTA: Este SQL se ejecuta dentro del esquema 'com_hubbi_inventory' automáticamente.
--       No es necesario usar prefijos en los nombres de tablas.
-- =============================================

-- 0. Tablas Maestras y Configuraciones Globales

-- 0.1 Unidades de Medida (UOM) Globales
CREATE TABLE IF NOT EXISTS uoms (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL, -- "Unidad", "Libra", "Caja 12"
    symbol TEXT NOT NULL, -- "u", "lb", "c12"
    is_active BOOLEAN DEFAULT TRUE
);

-- 0.2 Campos Personalizados Globales (Dynamic Fields)
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY,
    label TEXT NOT NULL,
    key_name TEXT NOT NULL UNIQUE, -- "color", "material"
    type TEXT DEFAULT 'text', -- 'text', 'number', 'boolean', 'select', 'date'
    options JSON DEFAULT '[]', -- Options for select type
    default_value TEXT,
    
    -- UI Logic
    group_name TEXT DEFAULT 'General', -- "Technical Specs", "Dimensions"
    scope TEXT DEFAULT 'all', -- 'all', 'product', 'asset', 'service'
    display_order INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- 0.3 Categorías (Requerido para productos)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name (e.g., 'Package', 'Cpu')
    color TEXT, -- Hex color for UI
    parent_id UUID, -- For nested categories (optional)
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- 0.4 Grupos (Opcional, vinculados a categorías)
CREATE TABLE IF NOT EXISTS item_groups (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID, -- Linked to category (optional)
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_item_groups_category ON item_groups(category_id);

-- 0.5 Subgrupos (Opcional, feature-flagged, vinculados a grupos)
CREATE TABLE IF NOT EXISTS subgroups (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    group_id UUID NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES item_groups(id)
);

CREATE INDEX IF NOT EXISTS idx_subgroups_group ON subgroups(group_id);

-- 1. Catálogo Maestro de Productos y Activos
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    
    -- Clasificación Jerárquica
    category_id UUID,
    group_id UUID,
    subgroup_id UUID,
    
    -- Tipología Principal
    type TEXT DEFAULT 'product', -- 'product', 'service', 'asset', 'kit'
    
    -- Unidades de Medida
    base_unit_id UUID NOT NULL,
    purchase_unit_id UUID,
    
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
    accounting_account_id UUID,
    tax_code_id UUID,
    
    -- Atributos Dinámicos
    attributes JSON DEFAULT '{}',
    asset_meta JSON DEFAULT '{}',
    
    -- Contexto Organizacional
    responsible_department_id UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (base_unit_id) REFERENCES uoms(id)
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_responsible_dept ON items(responsible_department_id);

-- 1.1 Unidades de Medida Alternativas por Ítem
CREATE TABLE IF NOT EXISTS item_uoms (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL,
    uom_id UUID NOT NULL,
    
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
    item_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    
    supplier_sku TEXT,
    last_cost REAL,
    lead_time_days INTEGER,
    
    is_preferred BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (item_id, supplier_id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 2. Bodegas (Warehouses)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    
    -- Datos de contacto
    address TEXT,
    phone TEXT,
    
    -- Contexto Organizacional
    sub_hub_id UUID,
    department_id UUID,
    
    -- Responsable de la bodega
    responsible_user_id UUID,
    
    -- Metadatos adicionales para WMS (coordenadas, dimensiones, etc.)
    wms_meta JSON DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouses_sub_hub ON warehouses(sub_hub_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_department ON warehouses(department_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_responsible ON warehouses(responsible_user_id);

-- 3. Existencias (Stock)
CREATE TABLE IF NOT EXISTS stock (
    item_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    
    quantity REAL DEFAULT 0,
    
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    alert_threshold REAL,
    
    last_count TIMESTAMP,
    
    PRIMARY KEY (item_id, warehouse_id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_item ON stock(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);

-- 4. Historial de Movimientos (Kardex)
CREATE TABLE IF NOT EXISTS movements (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'TRANSFER', 'CONSUME'
    reason TEXT,
    
    from_warehouse_id UUID,
    to_warehouse_id UUID,
    
    quantity REAL NOT NULL,
    uom_id TEXT,
    
    cost_at_moment REAL,
    reference_doc TEXT,
    notes TEXT,
    
    -- Contexto Organizacional
    department_id UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_department ON movements(department_id);

-- 5. Kits / Bill of Materials
CREATE TABLE IF NOT EXISTS kits (
    parent_item_id UUID NOT NULL,
    child_item_id UUID NOT NULL,
    quantity REAL NOT NULL,
    
    PRIMARY KEY (parent_item_id, child_item_id)
);

-- 6. Trazabilidad (Seriales & Lotes)
CREATE TABLE IF NOT EXISTS serials (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL,
    serial_number TEXT NOT NULL,
    lot_number TEXT,
    
    current_warehouse_id UUID,
    status TEXT DEFAULT 'available',
    
    expiration_date TIMESTAMP,
    production_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(item_id, serial_number)
);

-- 7. Transferencias
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY,
    from_hub_id UUID,
    to_hub_id UUID,
    requester_id UUID,
    status TEXT DEFAULT 'pending',
    items JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Schema Complete: All tables unified
-- =============================================
