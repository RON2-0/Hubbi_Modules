-- DTE Events Table for Fiscal Integration
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_dte_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'INVENTORY_IN_PURCHASE', 'INVENTORY_OUT_SALE', etc.
    movement_id TEXT NOT NULL,
    payload JSON NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    
    FOREIGN KEY (movement_id) REFERENCES com_hubbi_inventory_movements(id)
);

CREATE INDEX IF NOT EXISTS idx_dte_events_status ON com_hubbi_inventory_dte_events(status);
CREATE INDEX IF NOT EXISTS idx_dte_events_movement ON com_hubbi_inventory_dte_events(movement_id);
