-- ============================================================================
-- UPDATE: Additional Tables for Phase 7 Features
-- Run this after install.sql to add new features
-- ============================================================================

-- 1. Unit Conversions (caja → unidad, docena → unidad, etc.)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_unit_conversions (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    
    -- Base unit is always the smallest (e.g., 'unit')
    from_unit TEXT NOT NULL,  -- 'box', 'pack', 'dozen'
    to_unit TEXT NOT NULL,    -- 'unit'
    factor REAL NOT NULL,     -- How many to_unit in one from_unit (e.g., box=12 units)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES com_hubbi_inventory_items(id),
    UNIQUE(item_id, from_unit, to_unit)
);

-- 2. Substitute Products (when item A is out of stock, suggest item B)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_substitutes (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    substitute_item_id TEXT NOT NULL,
    
    priority INTEGER DEFAULT 1,  -- 1 = first choice, 2 = second, etc.
    notes TEXT,                  -- "Compatible with X series only"
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES com_hubbi_inventory_items(id),
    FOREIGN KEY (substitute_item_id) REFERENCES com_hubbi_inventory_items(id),
    UNIQUE(item_id, substitute_item_id)
);

-- 3. Cyclic Counting Configuration (inventory rotativo)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_cyclic_config (
    id TEXT PRIMARY KEY,
    location_id TEXT,           -- NULL = applies to all locations
    category_id TEXT,           -- NULL = applies to all categories
    
    frequency TEXT NOT NULL,    -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    abc_class TEXT,             -- 'A', 'B', 'C' for ABC analysis
    
    last_count_date DATE,
    next_count_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cyclic Counting Schedule (generated count tasks)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_cyclic_tasks (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    
    scheduled_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
    
    assigned_to TEXT,             -- User ID
    completed_at DATETIME,
    completed_by TEXT,
    
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (config_id) REFERENCES com_hubbi_inventory_cyclic_config(id),
    FOREIGN KEY (location_id) REFERENCES com_hubbi_inventory_locations(id)
);

-- 5. Export Reports Log (for auditing contador exports)
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_export_logs (
    id TEXT PRIMARY KEY,
    
    report_type TEXT NOT NULL,    -- 'kardex', 'stock_valuation', 'movements', 'fiscal'
    format TEXT NOT NULL,         -- 'xlsx', 'pdf', 'csv', 'json'
    
    period_start DATE,
    period_end DATE,
    
    filters JSON,                 -- Filters applied to the report
    row_count INTEGER,
    
    generated_by TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    file_path TEXT,               -- Local path or URL to the exported file
    file_size INTEGER
);

-- ============================================================================
-- INDEXES for new tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unit_conversions_item ON com_hubbi_inventory_unit_conversions(item_id);
CREATE INDEX IF NOT EXISTS idx_substitutes_item ON com_hubbi_inventory_substitutes(item_id);
CREATE INDEX IF NOT EXISTS idx_cyclic_config_location ON com_hubbi_inventory_cyclic_config(location_id);
CREATE INDEX IF NOT EXISTS idx_cyclic_tasks_date ON com_hubbi_inventory_cyclic_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cyclic_tasks_status ON com_hubbi_inventory_cyclic_tasks(status);
CREATE INDEX IF NOT EXISTS idx_export_logs_date ON com_hubbi_inventory_export_logs(generated_at);
