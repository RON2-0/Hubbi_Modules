import { InventoryEngine } from './engine';
import { MovementRequest, ValidationContext, CurrentInventoryState, PreparedTransaction } from './types';
import { MOVEMENT_TYPES } from './catalog';

/**
 * Inventory Transaction Manager
 * Orchestrates: Fetch State -> Validate -> Calculate -> Commit
 */
export class InventoryTransactionManager {

    constructor(
        private context: ValidationContext,
        // In a real implementation, we would inject a Repository/Service here to fetch data
        private dataProvider: {
            getState: (itemId: string, warehouseId?: string) => Promise<CurrentInventoryState>;
            persistMovement: (tx: PreparedTransaction) => Promise<boolean>;
            persistBatch?: (txs: PreparedTransaction[]) => Promise<boolean>;
        }
    ) { }

    /**
     * Step 1: Prepare
     * Reads state, runs engine, calculates effects. Does NOT write.
     */
    async prepare(request: MovementRequest): Promise<PreparedTransaction> {
        // 1. Fetch State
        const state = await this.dataProvider.getState(request.item_id, request.from_warehouse_id || request.to_warehouse_id);

        // 2. Run Validation Engine
        const validation = InventoryEngine.validate(this.context, request, state);

        if (!validation.success) {
            throw new Error(`Validation Failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }

        // 3. Calculate Effects
        const typeConfig = MOVEMENT_TYPES[request.movement_type];
        let delta = 0;

        if (typeConfig.direction === 'IN') {
            delta = request.quantity;
        } else if (typeConfig.direction === 'OUT') {
            delta = -request.quantity;
        }

        // Handle Neutral/Transfer logic if needed (might involve two sub-movements)

        const currentQty = state.current_stock?.quantity_on_hand || 0;
        const cost = state.item?.cost_avg || 0;
        const impact = cost * request.quantity;

        // Approval Logic
        // Rule: If Value > 100 AND Direction is OUT (Loss/Adjustment), Require Approval
        // Unless user is ADMIN
        let approvalStatus: 'APPROVED' | 'PENDING' = 'APPROVED';

        const isSensitive = typeConfig.direction === 'OUT' && impact > 100;
        const isAdmin = this.context.user_role === 'ADMIN' || this.context.user_role === 'SUPERVISOR';

        if (isSensitive && !isAdmin) {
            approvalStatus = 'PENDING';
        }

        return {
            request,
            validation,
            effects: {
                stock_delta: delta,
                new_quantity_on_hand: currentQty + delta,
                financial_impact: impact
            },
            approval_status: approvalStatus
        };
    }

    /**
     * Step 2: Commit
     * Writes to DB / Event Bus
     */
    async commit(tx: PreparedTransaction): Promise<boolean> {
        // 1. Double check (optional, concurrency)

        // 2. Persist
        // In a real scenario, this would wrap multiple DB ops in a transaction
        // - Insert Movement
        // - Update Stock
        // - Insert Serial History (if applicable)
        return await this.dataProvider.persistMovement(tx);
    }

    /**
     * Commit multiple transactions at once.
     * Useful for bulk imports or large transfers.
     */
    async commitBatch(txs: PreparedTransaction[]): Promise<boolean> {
        if (this.dataProvider.persistBatch) {
            return await this.dataProvider.persistBatch(txs);
        }

        // Fallback: Sequential Loop
        for (const tx of txs) {
            await this.commit(tx);
            // If one fails, we should probably stop? Or continue?
            // For now, simple implementation.
        }
        return true;
    }
}
