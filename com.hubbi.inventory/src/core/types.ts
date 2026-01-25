
/**
 * Core Type Definitions for Hubbi Inventory Module
 * @module Core/Types
 */

export type MovementDirection = 'IN' | 'OUT' | 'NEUTRAL'; // NEUTRAL implies Transfer (Out + In atomic)

export type InventoryRule =
    | 'check_stock_availability'      // Prevents negative stock (unless overridden)
    | 'check_serial_uniqueness'       // Ensures serial isn't already in system (for IN) or exists (for OUT)
    | 'check_lot_expiration'          // Warn or block if expired
    | 'check_warehouse_active'        // Ensure warehouse is not locked/audit
    | 'require_reason'                // Must have a text reason
    | 'require_source_location'       // Must specify FROM
    | 'require_target_location'       // Must specify TO
    | 'require_document_reference';   // Must link to Invoice/Order

export interface MovementTypeConfig {
    code: string;
    label: string;
    direction: MovementDirection;
    description: string;

    // Core Behaviors
    affects_cost: boolean;      // True = Recalculates Avg Cost (e.g. Purchase), False = Uses existing (e.g. Transfer)
    is_system_generated: boolean; // True = User cannot manually select this (e.g. Sales Issue derived from Invoice)

    // Validation Rules that ALWAYS apply to this movement type
    rules: InventoryRule[];

    // Audit / Reversability
    reversible_by?: string; // Code of the reversing movement
}

/**
 * Represents the context required to validate a movement
 */
export interface ValidationContext {
    profile: 'GENERIC' | 'RETAIL' | 'WORKSHOP' | 'PHARMACY';
    features: {
        allow_negative_stock: boolean;
        serial_tracking: boolean;
        batch_tracking: boolean;
    };
    user_role: string;
}

/**
 * Data required by the Engine to validate a request.
 * This decouples the Engine from the Database (Repository Pattern).
 */
export interface CurrentInventoryState {
    item: {
        id: string;
        is_active: boolean;
        is_service: boolean;
        is_kit: boolean;
        cost_avg?: number; // Added for approval thresholds
        allow_negative_stock_override?: boolean;
    } | null;

    source_warehouse?: {
        id: string;
        is_active: boolean;
        is_locked: boolean; // e.g. during Audit
    };

    target_warehouse?: {
        id: string;
        is_active: boolean;
        is_locked: boolean;
    };

    current_stock?: {
        quantity_on_hand: number;
        quantity_reserved: number;
    };

    serial_status?: 'AVAILABLE' | 'SOLD' | 'CONSUMED' | 'TRANSFERRED' | 'NOT_FOUND';
    lot_expiration?: string; // ISO Date
}

export interface MovementRequest {
    movement_type: string; // Key of MOVEMENT_TYPES
    item_id: string;
    quantity: number;

    from_warehouse_id?: string;
    to_warehouse_id?: string;

    serial_number?: string;
    lot_number?: string;
    document_ref?: string;
    reason?: string;

    timestamp: number;
}

export interface ValidationFailure {
    rule: string;
    message: string;
    meta?: Record<string, unknown>;
}

export interface ValidationResult {
    success: boolean;
    errors: ValidationFailure[];
}

/**
 * Result of a transaction preparation.
 * If successful, contains the data needed to commit.
 */
export interface PreparedTransaction {
    request: MovementRequest;
    validation: ValidationResult;
    // Calculated effects (e.g. new_stock_level, cost_impact)
    effects: {
        stock_delta: number;
        new_quantity_on_hand: number;
        financial_impact?: number;
    };
    approval_status?: 'APPROVED' | 'PENDING';
}
