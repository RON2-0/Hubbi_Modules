import { CurrentInventoryState, PreparedTransaction } from '../core/types';

/**
 * Repository implementation for Inventory Core
 * Bridges the gap between Pure Logic (Engine) and Side Effects (DB/SDK)
 */
export const InventoryDataProvider = {

    /**
     * Builds the state object required by the Engine
     */
    async getState(itemId: string, warehouseId?: string): Promise<CurrentInventoryState> {

        // 1. Fetch Item
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [item] = await window.hubbi.db.query<any>(
            `SELECT id, is_active, type, attributes FROM items WHERE id = ?`,
            [itemId],
            { moduleId: 'com.hubbi.inventory' }
        );

        if (!item) throw new Error(`Item ${itemId} not found`);

        const attributes = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : (item.attributes || {});

        // 2. Fetch Warehouse (if provided)
        let warehouse = undefined;
        if (warehouseId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [wh] = await window.hubbi.db.query<any>(
                `SELECT id, is_active FROM warehouses WHERE id = ?`,
                [warehouseId],
                { moduleId: 'com.hubbi.inventory' }
            );
            warehouse = wh;
        }

        // 3. Fetch Stock
        let stock = undefined;
        if (warehouseId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [st] = await window.hubbi.db.query<any>(
                `SELECT quantity FROM stock WHERE item_id = ? AND warehouse_id = ?`,
                [itemId, warehouseId],
                { moduleId: 'com.hubbi.inventory' }
            );
            stock = {
                quantity_on_hand: st ? st.quantity : 0,
                quantity_reserved: 0 // TODO: Implement reservations table query
            };
        }

        // 4. Return formatted state
        return {
            item: {
                id: item.id,
                is_active: Boolean(item.is_active),
                is_service: item.type === 'service',
                is_kit: item.type === 'kit',
                allow_negative_stock_override: attributes.allow_negative_stock === true
            },
            source_warehouse: warehouse ? {
                id: warehouse.id,
                is_active: Boolean(warehouse.is_active),
                is_locked: false // TODO: Audit locking logic
            } : undefined,
            // Assuming simplified single-warehouse context for now (Source = Target in simple checks)
            // For Transfers, we would need to fetch both. 
            // The TransactionManager calls this with just ONE warehouse ID usually (From OR To)
            // But the types support both. This is a simplification.
            current_stock: stock,
            serial_status: 'NOT_FOUND' // TODO: Implement Serial table check
        };
    },

    /**
     * Persists the transaction to the database
     */
    async persistMovement(tx: PreparedTransaction): Promise<boolean> {
        const { request, effects } = tx;

        // 1. Insert Movement Record
        await window.hubbi.db.execute(
            `INSERT INTO movements (id, item_id, user_id, type, quantity, from_warehouse_id, to_warehouse_id, reason, reference_doc, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                crypto.randomUUID(),
                request.item_id,
                window.hubbi.getContext().userId,
                request.movement_type,
                request.quantity,
                request.from_warehouse_id || null,
                request.to_warehouse_id || null,
                request.reason || '',
                request.document_ref || null,
                new Date().toISOString()
            ],
            { moduleId: 'com.hubbi.inventory' }
        );

        // 2. Update Stock (Upsert Logic)
        // If movement is OUT, warehouse is FROM
        // If movement is IN, warehouse is TO
        const targetWarehouse = request.to_warehouse_id || request.from_warehouse_id;

        if (targetWarehouse && effects.stock_delta !== 0) {
            // Check if exists
            const [existing] = await window.hubbi.db.query(
                `SELECT quantity FROM stock WHERE item_id = ? AND warehouse_id = ?`,
                [request.item_id, targetWarehouse],
                { moduleId: 'com.hubbi.inventory' }
            );

            if (existing) {
                await window.hubbi.db.execute(
                    `UPDATE stock SET quantity = quantity + ?, last_count = ? WHERE item_id = ? AND warehouse_id = ?`,
                    [effects.stock_delta, new Date().toISOString(), request.item_id, targetWarehouse],
                    { moduleId: 'com.hubbi.inventory' }
                );
            } else {
                // If it's a positive move, create. If negative, create with negative (if allowed)
                await window.hubbi.db.execute(
                    `INSERT INTO stock (item_id, warehouse_id, quantity, last_count) VALUES (?, ?, ?, ?)`,
                    [request.item_id, targetWarehouse, effects.stock_delta, new Date().toISOString()],
                    { moduleId: 'com.hubbi.inventory' }
                );
            }
        }

        return true;
    },

    /**
     * Persists multiple transactions.
     * Currently implements sequential execution for safety, 
     * but allows for future optimization (e.g. Bulk INSERTs).
     */
    async persistBatch(txs: PreparedTransaction[]): Promise<boolean> {
        // Optimization: We could group all movements into a single INSERT string
        // But stock updates need to be careful about conflicting Item/Warehouse pairs.

        // For now, sequential execution ensures correctness and safety.
        for (const tx of txs) {
            await this.persistMovement(tx);
        }
        return true;
    }
};
