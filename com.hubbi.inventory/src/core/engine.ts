import { MOVEMENT_TYPES } from './catalog';
import {
    CurrentInventoryState,
    InventoryRule,
    MovementRequest,
    ValidationContext,
    ValidationResult,
    ValidationFailure
} from './types';

/**
 * Inventory Validation Engine
 * "The Gatekeeper" - Nothing enters the ledger without passing here.
 */
export class InventoryEngine {

    /**
     * Main validation entry point.
     * Pure function: Input (Context, Request, State) -> Output (Result)
     */
    static validate(
        ctx: ValidationContext,
        req: MovementRequest,
        state: CurrentInventoryState
    ): ValidationResult {
        const errors: ValidationFailure[] = [];

        // 1. Validate Movement Type Existence
        const config = MOVEMENT_TYPES[req.movement_type];
        if (!config) {
            return { success: false, errors: [{ rule: 'system', message: `Invalid movement type: ${req.movement_type}` }] };
        }

        // 2. Iterate Configured Rules
        for (const rule of config.rules) {
            const failure = this.checkRule(rule, ctx, req, state);
            if (failure) {
                errors.push(failure);
            }
        }

        return {
            success: errors.length === 0,
            errors
        };
    }

    // ========================================================================
    // RULE IMPLEMENTATIONS
    // ========================================================================

    private static checkRule(
        rule: InventoryRule,
        ctx: ValidationContext,
        req: MovementRequest,
        state: CurrentInventoryState
    ): ValidationFailure | null {

        switch (rule) {
            case 'check_stock_availability':
                return this.checkStockAvailability(ctx, req, state);

            case 'require_source_location':
                if (!req.from_warehouse_id) return { rule, message: 'Source warehouse is required.' };
                if (!state.source_warehouse) return { rule, message: 'Source warehouse not found or invalid.' };
                return null;

            case 'require_target_location':
                if (!req.to_warehouse_id) return { rule, message: 'Target warehouse is required.' };
                if (!state.target_warehouse) return { rule, message: 'Target warehouse not found or invalid.' };
                return null;

            case 'check_warehouse_active':
                if (state.source_warehouse?.is_active === false) return { rule, message: 'Source warehouse is inactive.' };
                if (state.source_warehouse?.is_locked) return { rule, message: 'Source warehouse is locked for audit.' };
                if (state.target_warehouse?.is_active === false) return { rule, message: 'Target warehouse is inactive.' };
                if (state.target_warehouse?.is_locked) return { rule, message: 'Target warehouse is locked for audit.' };
                return null;

            case 'require_reason':
                if (!req.reason || req.reason.trim().length === 0) return { rule, message: 'A reason is required for this movement.' };
                return null;

            case 'require_document_reference':
                if (!req.document_ref) return { rule, message: 'A document reference (Invoice/Order) is required.' };
                return null;

            case 'check_serial_uniqueness': {
                // Logic depends on direction
                // IN: Serial should NOT exist (or be 'SOLD' maybe?)
                // OUT: Serial MUST exist and be 'AVAILABLE'
                const config = MOVEMENT_TYPES[req.movement_type];
                if (config.direction === 'IN') {
                    if (state.serial_status && state.serial_status !== 'SOLD' && state.serial_status !== 'NOT_FOUND') {
                        return { rule, message: `Serial ${req.serial_number} already exists in inventory.` };
                    }
                } else if (config.direction === 'OUT' || config.direction === 'NEUTRAL') {
                    if (!req.serial_number) return null; // If item is not serialized, we skip (handled by other check?)
                    // Actually, if it's serialized, req.serial_number should be present? 
                    // That's more of a "Item is serialized" rule. Assuming checking uniqueness logic here:
                    if (state.serial_status !== 'AVAILABLE') {
                        return { rule, message: `Serial ${req.serial_number} is not available (Status: ${state.serial_status}).` };
                    }
                }
                return null;
            }

            case 'check_lot_expiration':
                if (state.lot_expiration) {
                    const expDate = new Date(state.lot_expiration).getTime();
                    const now = Date.now();
                    if (expDate < now) {
                        // Some profiles might just warn, strict ones block.
                        // For now, let's block strict profiles.
                        if (ctx.profile === 'PHARMACY' || ctx.profile === 'RETAIL') {
                            return { rule, message: 'Lot is expired.' };
                        }
                    }
                }
                return null;

            default:
                return null;
        }
    }

    private static checkStockAvailability(
        ctx: ValidationContext,
        req: MovementRequest,
        state: CurrentInventoryState
    ): ValidationFailure | null {
        // 1. Service items don't track stock
        if (state.item?.is_service) return null;

        // 2. Allow negative stock override (Global or Per Item)
        if (ctx.features.allow_negative_stock || state.item?.allow_negative_stock_override) return null;

        // 3. Mathematical check
        const currentQty = state.current_stock?.quantity_on_hand || 0;
        const requestedQty = req.quantity;

        // NOTE: We assume req.quantity is always positive absolute value
        // The movement type direction determines the math, but here we are checking if we have enough TO SUBTRACT.
        // check_stock_availability rule is usually for OUT movements.

        if (currentQty < requestedQty) {
            return {
                rule: 'check_stock_availability',
                message: `Insufficient stock. Requested: ${requestedQty}, Available: ${currentQty}`
            };
        }

        return null;
    }
}
