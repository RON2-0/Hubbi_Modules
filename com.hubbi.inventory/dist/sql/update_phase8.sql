-- ============================================================================
-- UPDATE: Phase 8 - Final Feature Additions
-- Adds product groups, categories table, and unit decimal configuration
-- ============================================================================

-- 1. Product Groups / Families
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT, -- For hierarchical groups
    
    -- Visual
    color TEXT,
    icon TEXT,
    
    -- Control
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES com_hubbi_inventory_groups(id)
);

-- 2. Categories (separate from groups for more flexibility)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT, -- For hierarchical categories
    
    -- Visual
    color TEXT,
    icon TEXT,
    
    -- Tax configuration (El Salvador)
    default_tax_rate REAL DEFAULT 0.13,
    is_exempt BOOLEAN DEFAULT FALSE, -- For tax-exempt products
    
    -- Control
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES com_hubbi_inventory_categories(id)
);

-- 3. Currency Configuration
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_currencies (
    id TEXT PRIMARY KEY, -- 'USD', 'EUR', etc.
    name TEXT NOT NULL, -- 'Dólar Estadounidense'
    symbol TEXT NOT NULL, -- '$'
    decimal_places INTEGER DEFAULT 2,
    is_default BOOLEAN DEFAULT FALSE,
    exchange_rate REAL DEFAULT 1.0, -- Rate to convert to default currency
    is_active BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default currency for El Salvador
INSERT OR IGNORE INTO com_hubbi_inventory_currencies (id, name, symbol, decimal_places, is_default, is_active)
VALUES ('USD', 'Dólar Estadounidense', '$', 2, TRUE, TRUE);

-- 4. Unit of Measure Configuration (with decimal settings)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_units (
    id TEXT PRIMARY KEY, -- 'unit', 'box', 'kg', etc.
    name TEXT NOT NULL, -- 'Unidad', 'Caja', 'Kilogramo'
    abbreviation TEXT NOT NULL, -- 'ud', 'caj', 'kg'
    
    -- Decimal configuration
    allow_decimals BOOLEAN DEFAULT FALSE,
    decimal_places INTEGER DEFAULT 0, -- 0 for integers, 2-4 for decimals
    
    -- Categorization
    category TEXT, -- 'quantity', 'weight', 'volume', 'length'
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default units
INSERT OR IGNORE INTO com_hubbi_inventory_units (id, name, abbreviation, allow_decimals, decimal_places, category, sort_order) VALUES
    ('unit', 'Unidad', 'ud', FALSE, 0, 'quantity', 1),
    ('box', 'Caja', 'caja', FALSE, 0, 'quantity', 2),
    ('pack', 'Paquete', 'paq', FALSE, 0, 'quantity', 3),
    ('dozen', 'Docena', 'doc', FALSE, 0, 'quantity', 4),
    ('pair', 'Par', 'par', FALSE, 0, 'quantity', 5),
    ('set', 'Juego', 'jgo', FALSE, 0, 'quantity', 6),
    ('kg', 'Kilogramo', 'kg', TRUE, 3, 'weight', 10),
    ('g', 'Gramo', 'g', TRUE, 2, 'weight', 11),
    ('lb', 'Libra', 'lb', TRUE, 2, 'weight', 12),
    ('l', 'Litro', 'L', TRUE, 3, 'volume', 20),
    ('ml', 'Mililitro', 'mL', TRUE, 1, 'volume', 21),
    ('gal', 'Galón', 'gal', TRUE, 2, 'volume', 22),
    ('m', 'Metro', 'm', TRUE, 2, 'length', 30),
    ('cm', 'Centímetro', 'cm', TRUE, 1, 'length', 31),
    ('ft', 'Pie', 'ft', TRUE, 2, 'length', 32);

-- 5. Price Lists (for multiple pricing strategies)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_price_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- 'Lista General', 'Mayoreo', 'Distribuidor'
    description TEXT,
    
    currency_id TEXT DEFAULT 'USD',
    
    -- Discount/markup configuration
    markup_percentage REAL DEFAULT 0, -- % to add to base price
    discount_percentage REAL DEFAULT 0, -- % to subtract from base price
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (currency_id) REFERENCES com_hubbi_inventory_currencies(id)
);

-- Insert default price list
INSERT OR IGNORE INTO com_hubbi_inventory_price_lists (id, name, is_default, is_active)
VALUES ('default', 'Lista General', TRUE, TRUE);

-- 6. Item Prices per Price List
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_item_prices (
    item_id TEXT NOT NULL,
    price_list_id TEXT NOT NULL,
    
    price REAL NOT NULL,
    min_quantity REAL DEFAULT 1, -- Minimum qty for this price
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (item_id, price_list_id, min_quantity),
    FOREIGN KEY (item_id) REFERENCES com_hubbi_inventory_items(id),
    FOREIGN KEY (price_list_id) REFERENCES com_hubbi_inventory_price_lists(id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_groups_parent ON com_hubbi_inventory_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON com_hubbi_inventory_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_item ON com_hubbi_inventory_item_prices(item_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_list ON com_hubbi_inventory_item_prices(price_list_id);
