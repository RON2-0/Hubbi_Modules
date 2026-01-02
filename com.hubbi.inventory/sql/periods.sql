-- ============================================================================
-- FISCAL PERIODS - Shared Tables
-- These tables use no module prefix so they can be shared across modules
-- Priority: com.hubbi.accounting > first installed module
-- ============================================================================

-- 1. Fiscal Periods Configuration
CREATE TABLE IF NOT EXISTS hubbi_fiscal_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    
    -- Lock configuration
    lock_after_periods INTEGER DEFAULT 2,  -- Block editing after N periods back
    auto_close BOOLEAN DEFAULT FALSE,      -- Auto-close period at month end
    
    -- Period type
    period_type TEXT DEFAULT 'monthly',    -- 'monthly', 'quarterly', 'annual'
    fiscal_year_start_month INTEGER DEFAULT 1, -- 1=January, 4=April (for fiscal years)
    
    -- Who manages periods
    managed_by TEXT,                       -- 'com.hubbi.accounting', 'com.hubbi.inventory', etc.
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT OR IGNORE INTO hubbi_fiscal_config (id, lock_after_periods, period_type)
VALUES ('default', 2, 'monthly');

-- 2. Fiscal Periods
CREATE TABLE IF NOT EXISTS hubbi_fiscal_periods (
    id TEXT PRIMARY KEY,
    
    -- Period identification
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,               -- 1-12 for monthly, 0 for annual
    quarter INTEGER,                      -- 1-4 for quarterly periods
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'open',           -- 'open', 'closed', 'locked'
    is_current BOOLEAN DEFAULT FALSE,     -- Only ONE period can be current
    
    -- Ownership
    created_by_module TEXT,               -- Module that created this period
    
    -- Closure info
    closed_by TEXT,                       -- User ID who closed it
    closed_at DATETIME,
    locked_at DATETIME,                   -- When it was auto-locked
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(year, month)
);

-- 3. Period Snapshots (stock at period close)
CREATE TABLE IF NOT EXISTS hubbi_period_snapshots (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL,
    
    -- Snapshot data (JSON for flexibility)
    snapshot_type TEXT NOT NULL,          -- 'inventory_stock', 'accounts_balance', etc.
    data JSON NOT NULL,                   -- Snapshot data
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (period_id) REFERENCES hubbi_fiscal_periods(id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_periods_year_month ON hubbi_fiscal_periods(year, month);
CREATE INDEX IF NOT EXISTS idx_periods_status ON hubbi_fiscal_periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_current ON hubbi_fiscal_periods(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_snapshots_period ON hubbi_period_snapshots(period_id);

-- ============================================================================
-- INITIALIZE CURRENT PERIOD (if empty)
-- This creates the current month as an open period
-- ============================================================================

-- Note: This would typically be done via code, but we can provide a template
-- INSERT OR IGNORE INTO hubbi_fiscal_periods (id, year, month, start_date, end_date, status, is_current, created_by_module)
-- VALUES (
--     strftime('%Y-%m', 'now'),
--     CAST(strftime('%Y', 'now') AS INTEGER),
--     CAST(strftime('%m', 'now') AS INTEGER),
--     date('now', 'start of month'),
--     date('now', 'start of month', '+1 month', '-1 day'),
--     'open',
--     TRUE,
--     'com.hubbi.inventory'
-- );
