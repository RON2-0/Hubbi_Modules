import { InventoryItem } from '../types/inventory';

/**
 * Core Domain Logic for Inventory Management
 * Handles Costing, Validation, and Calculations independent of UI/DB.
 */
export class InventoryCore {

    /**
     * Calculates the new Weighted Average Cost (Costo Promedio Ponderado).
     * Formula: ((CurrentStock * CurrentAvgCost) + (NewQty * NewUnitCost)) / (CurrentStock + NewQty)
     */
    static calculateNewWeightedAverageCost(
        currentStock: number,
        currentAvgCost: number,
        newQty: number,
        newUnitCost: number
    ): number {
        if (currentStock + newQty === 0) return 0;

        // Prevent negative stock math causing weird costs (though stock shouldn't be negative ideally)
        const safeCurrentStock = Math.max(0, currentStock);

        const totalValue = (safeCurrentStock * currentAvgCost) + (newQty * newUnitCost);
        const totalQty = safeCurrentStock + newQty;

        return totalQty > 0 ? parseFloat((totalValue / totalQty).toFixed(4)) : 0;
    }

    /**
     * Validates if a movement is possible based on available stock.
     */
    static validateStockAvailability(
        currentStock: number,
        requestedQty: number,
        allowNegative: boolean = false
    ): { allowed: boolean; message?: string } {
        if (requestedQty <= 0) {
            return { allowed: false, message: 'La cantidad debe ser mayor a 0' };
        }

        if (!allowNegative && currentStock < requestedQty) {
            return {
                allowed: false,
                message: `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${requestedQty}`
            };
        }

        return { allowed: true };
    }

    /**
     * Determines the cost to apply for an OUT movement.
     * Uses Weighted Average for standard items, or Specific Cost for Serialized/Loded items if provided.
     */
    static determineOutCost(
        item: InventoryItem,
        specificCost?: number
    ): number {
        // If specific cost is provided (e.g., from a specific batch/serial), use it.
        // Otherwise, use the item's current weighted average cost.
        if (specificCost !== undefined && (item.type === 'serialized' || item.type === 'asset')) {
            return specificCost;
        }
        return item.weighted_average_cost;
    }
}
