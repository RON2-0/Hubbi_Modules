import { useState } from 'react';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';
import { InventoryCore } from '../logic/inventory-core';

interface MovementRequest {
    item: InventoryItem;
    location_id: string;
    type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT';
    quantity: number;
    unit_cost?: number; // Required for IN/ADJUST(+)
    reason?: string;
    reference?: { type: string; id: string };
}

export const useInventoryMovements = () => {
    const [processing, setProcessing] = useState(false);

    const registerMovement = async (req: MovementRequest) => {
        setProcessing(true);
        try {
            // 1. Fetch current stock for this location to be safe
            // In a real high-concurrency scenario, this check should happen at DB level (stored procedure or constraint)
            // For now, we do optimistic checking.
            const stockData = await hubbi.data.query(
                `SELECT quantity FROM com_hubbi_inventory_stock WHERE item_id = ? AND location_id = ?`,
                [req.item.id, req.location_id]
            );

            const currentStock = stockData?.[0]?.quantity || 0;

            // 2. Validate
            if (req.type === 'OUT' || req.type === 'TRANSFER_OUT') {
                const validation = InventoryCore.validateStockAvailability(currentStock, req.quantity);
                if (!validation.allowed) throw new Error(validation.message);
            }

            // 3. Calculate New Item State (Costing)
            let newAvgCost = req.item.weighted_average_cost;
            let costAtMoment = req.unit_cost || req.item.weighted_average_cost;

            if (req.type === 'IN' || (req.type === 'ADJUST' && req.quantity > 0)) {
                if (req.unit_cost === undefined) throw new Error("Costo unitario requerido para entradas.");

                // Fetch GLOBAL stock for costing (Costing is usually global or per-company, not per-shelf)
                // Assuming global costing for now.
                const globalStockData = await hubbi.data.query(
                    `SELECT SUM(quantity) as total FROM com_hubbi_inventory_stock WHERE item_id = ?`,
                    [req.item.id]
                );
                const globalStock = globalStockData?.[0]?.total || 0;

                newAvgCost = InventoryCore.calculateNewWeightedAverageCost(
                    globalStock,
                    req.item.weighted_average_cost,
                    req.quantity,
                    req.unit_cost
                );
                costAtMoment = req.unit_cost;
            } else {
                // For OUT, cost is the current average
                costAtMoment = req.item.weighted_average_cost;
            }

            // 4. Batch Operations (Movement + Stock Update + Item Cost Update)
            // Ideally wrapped in a transaction if supported by SDK

            // A. Record Movement
            const movementId = crypto.randomUUID();
            await hubbi.data.create({
                table: 'com_hubbi_inventory_movements',
                data: {
                    id: movementId,
                    item_id: req.item.id,
                    location_id: req.location_id,
                    type: req.type,
                    quantity: req.quantity,
                    reason: req.reason,
                    cost_at_moment: costAtMoment,
                    total_value: costAtMoment * req.quantity,
                    document_type: req.reference?.type,
                    document_number: req.reference?.id,
                    created_by: 'current_user', // SDK should handle this
                    created_at: new Date().toISOString()
                },
                options: { strategy: 'online_first' }
            });

            // B. Update Stock (Upsert logic)
            // Calculate new quantity for the location
            const qtyChange = (req.type === 'IN' || req.type === 'TRANSFER_IN' || (req.type === 'ADJUST' && req.quantity > 0))
                ? req.quantity
                : -req.quantity;

            // We use raw SQL for atomic update if possible, or upsert helper
            // Simple upsert logic:
            const newLocationQty = currentStock + qtyChange;

            // Check if record exists to decide insert vs update
            if (stockData && stockData.length > 0) {
                await hubbi.data.execute(
                    `UPDATE com_hubbi_inventory_stock SET quantity = ? WHERE item_id = ? AND location_id = ?`,
                    [newLocationQty, req.item.id, req.location_id]
                );
            } else {
                await hubbi.data.execute(
                    `INSERT INTO com_hubbi_inventory_stock (item_id, location_id, quantity) VALUES (?, ?, ?)`,
                    [req.item.id, req.location_id, newLocationQty]
                );
            }

            // C. Update Item Cost (if changed)
            if (newAvgCost !== req.item.weighted_average_cost) {
                await hubbi.data.update({
                    table: 'com_hubbi_inventory_items',
                    id: req.item.id,
                    data: {
                        weighted_average_cost: newAvgCost,
                        last_cost: req.unit_cost || req.item.last_cost
                    },
                    options: { strategy: 'online_first' }
                });
            }

            hubbi.notify.success('Movimiento registrado exitosamente');
            return { success: true, movementId };

        } catch (error: unknown) {
            console.error(error);
            hubbi.notify.error((error instanceof Error ? error.message : String(error)) || 'Error al registrar movimiento');
            return { success: false, error };
        } finally {
            setProcessing(false);
        }
    };

    return {
        registerMovement,
        processing
    };
};
