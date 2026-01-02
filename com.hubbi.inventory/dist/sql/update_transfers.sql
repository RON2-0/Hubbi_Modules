-- Table for managing Inter-Branch Transfer Workflow
CREATE TABLE IF NOT EXISTS com_hubbi_inventory_transfer_requests (
    id TEXT PRIMARY KEY,
    
    source_location_id TEXT NOT NULL,
    target_location_id TEXT NOT NULL,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'in_transit', 'received'
    
    -- JSON array of requested items: [{ item_id: string, quantity: number }]
    items JSON NOT NULL,
    
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    received_by TEXT,
    
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_source ON com_hubbi_inventory_transfer_requests(source_location_id);
CREATE INDEX IF NOT EXISTS idx_transfer_target ON com_hubbi_inventory_transfer_requests(target_location_id);
CREATE INDEX IF NOT EXISTS idx_transfer_status ON com_hubbi_inventory_transfer_requests(status);
