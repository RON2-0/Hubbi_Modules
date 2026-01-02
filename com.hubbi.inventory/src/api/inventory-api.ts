/**
 * Inventory API - Inter-Module Communication Layer
 * 
 * This file exposes public methods that other Hubbi modules can call
 * to interact with the inventory system.
 * 
 * Usage from other modules:
 *   const result = await window.hubbi.modules.call('com.hubbi.inventory', 'getStock', { itemId: '...' });
 */

import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';
import { getCurrentPeriod, isPeriodEditableById } from '../hooks/useFiscalPeriods';

// =============================================================================
// STOCK QUERIES
// =============================================================================

export interface StockInfo {
    itemId: string;
    locationId: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
    minStock: number;
    reorderPoint: number;
}

/**
 * Get stock information for an item at a specific location
 * Available = Total - Reserved
 */
export async function getStock(params: { itemId: string; locationId?: string }): Promise<StockInfo[]> {
    const { itemId, locationId } = params;

    let sql = `
    SELECT 
      s.item_id as itemId,
      s.location_id as locationId,
      s.quantity as totalStock,
      COALESCE((
        SELECT SUM(r.quantity) 
        FROM com_hubbi_inventory_reservations r 
        WHERE r.item_id = s.item_id 
          AND r.location_id = s.location_id 
          AND r.status = 'active'
      ), 0) as reservedStock,
      s.min_stock as minStock,
      s.reorder_point as reorderPoint
    FROM com_hubbi_inventory_stock s
    WHERE s.item_id = ?
  `;
    const queryParams: unknown[] = [itemId];

    if (locationId) {
        sql += ` AND s.location_id = ?`;
        queryParams.push(locationId);
    }

    const rows = await hubbi.db.query(sql, queryParams, { moduleId: 'com.hubbi.inventory' });

    return rows.map((row: Record<string, unknown>) => ({
        itemId: row.itemId as string,
        locationId: row.locationId as string,
        totalStock: row.totalStock as number,
        reservedStock: row.reservedStock as number,
        availableStock: (row.totalStock as number) - (row.reservedStock as number),
        minStock: row.minStock as number,
        reorderPoint: row.reorderPoint as number,
    }));
}

/**
 * Check if an item has enough available stock for a given quantity
 * Used by billing/sales modules before creating invoices
 */
export async function checkAvailability(params: {
    itemId: string;
    locationId: string;
    quantity: number;
}): Promise<{ available: boolean; currentStock: number; requestedQuantity: number }> {
    const stocks = await getStock({ itemId: params.itemId, locationId: params.locationId });

    if (stocks.length === 0) {
        return { available: false, currentStock: 0, requestedQuantity: params.quantity };
    }

    const stock = stocks[0];
    return {
        available: stock.availableStock >= params.quantity,
        currentStock: stock.availableStock,
        requestedQuantity: params.quantity,
    };
}

/**
 * Get items that are below their reorder point
 * Used by procurement/imports modules
 */
export async function getLowStockItems(params?: { locationId?: string }): Promise<Array<{
    itemId: string;
    itemName: string;
    sku: string;
    locationId: string;
    currentStock: number;
    reorderPoint: number;
    deficit: number;
}>> {
    let sql = `
    SELECT 
      i.id as itemId,
      i.name as itemName,
      i.sku,
      s.location_id as locationId,
      s.quantity as currentStock,
      s.reorder_point as reorderPoint,
      (s.reorder_point - s.quantity) as deficit
    FROM com_hubbi_inventory_stock s
    JOIN com_hubbi_inventory_items i ON s.item_id = i.id
    WHERE s.quantity <= s.reorder_point
      AND i.is_active = TRUE
  `;
    const queryParams: unknown[] = [];

    if (params?.locationId) {
        sql += ` AND s.location_id = ?`;
        queryParams.push(params.locationId);
    }

    sql += ` ORDER BY deficit DESC`;

    return await hubbi.db.query(sql, queryParams, { moduleId: 'com.hubbi.inventory' });
}

// =============================================================================
// RESERVATIONS (for Workshop / Work Orders)
// =============================================================================

export interface ReservationParams {
    itemId: string;
    locationId: string;
    quantity: number;
    referenceType: 'work_order' | 'transfer_out' | 'sale_hold' | 'maintenance';
    referenceId: string;
    expiresAt?: string; // ISO date string
    createdBy: string;
}

export interface ReservationResult {
    success: boolean;
    reservationId?: string;
    error?: string;
}

/**
 * Create a reservation for internal use (workshop, maintenance, etc.)
 * This blocks stock from being sold until consumed or cancelled
 */
export async function createReservation(params: ReservationParams): Promise<ReservationResult> {
    // Check availability first
    const availability = await checkAvailability({
        itemId: params.itemId,
        locationId: params.locationId,
        quantity: params.quantity,
    });

    if (!availability.available) {
        return {
            success: false,
            error: `Stock insuficiente. Disponible: ${availability.currentStock}, Solicitado: ${params.quantity}`,
        };
    }

    const reservationId = crypto.randomUUID();

    await hubbi.db.execute(`
    INSERT INTO com_hubbi_inventory_reservations 
      (id, item_id, location_id, quantity, reference_type, reference_id, created_by, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `, [
        reservationId,
        params.itemId,
        params.locationId,
        params.quantity,
        params.referenceType,
        params.referenceId,
        params.createdBy,
        params.expiresAt || null,
    ], { moduleId: 'com.hubbi.inventory' });

    // Emit event for other modules
    emitInventoryEvent('reservation:created', {
        reservationId,
        itemId: params.itemId,
        quantity: params.quantity,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
    });

    // Audit trail
    hubbi.audit?.({
        action: 'reservation_created',
        entity: 'inventory_reservation',
        entityId: reservationId,
        description: `Reserva de ${params.quantity} unidades para ${params.referenceType}:${params.referenceId}`
    });

    return { success: true, reservationId };
}

/**
 * Consume a reservation (actually deduct stock)
 * Called when work order is completed
 */
export async function consumeReservation(params: {
    reservationId: string;
    consumedBy: string;
}): Promise<{ success: boolean; movementId?: string; error?: string }> {
    // Get reservation details
    const reservations = await hubbi.db.query(
        `SELECT * FROM com_hubbi_inventory_reservations WHERE id = ? AND status = 'active'`,
        [params.reservationId],
        { moduleId: 'com.hubbi.inventory' }
    );

    if (reservations.length === 0) {
        return { success: false, error: 'Reserva no encontrada o ya consumida' };
    }

    const reservation = reservations[0] as Record<string, unknown>;
    const movementId = crypto.randomUUID();

    // Get current cost for the movement
    const items = await hubbi.db.query(
        `SELECT weighted_average_cost FROM com_hubbi_inventory_items WHERE id = ?`,
        [reservation.item_id],
        { moduleId: 'com.hubbi.inventory' }
    );
    const costAtMoment = items.length > 0 ? (items[0] as Record<string, unknown>).weighted_average_cost as number : 0;
    const quantity = reservation.quantity as number;

    // Create movement
    await hubbi.db.execute(`
    INSERT INTO com_hubbi_inventory_movements 
      (id, item_id, location_id, type, reason, quantity, cost_at_moment, total_value, created_by)
    VALUES (?, ?, ?, 'OUT', 'internal_use', ?, ?, ?, ?)
  `, [
        movementId,
        reservation.item_id,
        reservation.location_id,
        quantity,
        costAtMoment,
        quantity * costAtMoment,
        params.consumedBy,
    ], { moduleId: 'com.hubbi.inventory' });

    // Deduct stock
    await hubbi.db.execute(`
    UPDATE com_hubbi_inventory_stock 
    SET quantity = quantity - ? 
    WHERE item_id = ? AND location_id = ?
  `, [quantity, reservation.item_id, reservation.location_id], { moduleId: 'com.hubbi.inventory' });

    // Mark reservation as consumed
    await hubbi.db.execute(`
    UPDATE com_hubbi_inventory_reservations SET status = 'consumed' WHERE id = ?
  `, [params.reservationId], { moduleId: 'com.hubbi.inventory' });

    // Emit events
    emitInventoryEvent('reservation:consumed', {
        reservationId: params.reservationId,
        movementId,
        itemId: reservation.item_id,
        quantity,
    });

    emitInventoryEvent('stock:decreased', {
        itemId: reservation.item_id,
        locationId: reservation.location_id,
        quantity,
        reason: 'internal_use',
        movementId,
    });

    return { success: true, movementId };
}

/**
 * Cancel a reservation (release stock back to available)
 */
export async function cancelReservation(params: {
    reservationId: string;
    reason?: string;
}): Promise<{ success: boolean }> {
    await hubbi.db.execute(`
    UPDATE com_hubbi_inventory_reservations SET status = 'cancelled' WHERE id = ?
  `, [params.reservationId], { moduleId: 'com.hubbi.inventory' });

    emitInventoryEvent('reservation:cancelled', {
        reservationId: params.reservationId,
        reason: params.reason,
    });

    return { success: true };
}

// =============================================================================
// STOCK MOVEMENTS (for Imports / Billing)
// =============================================================================

export interface MovementParams {
    itemId: string;
    locationId: string;
    type: 'IN' | 'OUT' | 'ADJUST';
    reason: 'purchase' | 'sale' | 'internal_use' | 'correction' | 'initial_load' | 'import' | 'return';
    quantity: number;
    unitCost?: number;
    documentType?: string;
    documentNumber?: string;
    documentUuid?: string;
    createdBy: string;
    subHubId?: string;
    periodId?: string; // Fiscal period ID - auto-assigned to current if not provided
}

/**
 * Record a stock movement (entry, exit, adjustment)
 * Used by billing module for sales, imports module for receipts
 */
export async function recordMovement(params: MovementParams): Promise<{
    success: boolean;
    movementId?: string;
    newStock?: number;
    error?: string;
}> {
    // For OUT movements, check availability (unless it's an adjustment)
    if (params.type === 'OUT' && params.reason !== 'correction') {
        const availability = await checkAvailability({
            itemId: params.itemId,
            locationId: params.locationId,
            quantity: params.quantity,
        });

        if (!availability.available) {
            return {
                success: false,
                error: `Stock insuficiente. Disponible: ${availability.currentStock}, Solicitado: ${params.quantity}`
            };
        }
    }

    // Get current period if not provided
    let periodId = params.periodId;
    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod?.id;
    }

    // Validate period is editable
    if (periodId) {
        const isEditable = await isPeriodEditableById(periodId);
        if (!isEditable) {
            return {
                success: false,
                error: `El período ${periodId} está cerrado o bloqueado. No se pueden registrar movimientos.`
            };
        }
    }

    // Validate sub_hub permission if sub_hub specified
    if (params.subHubId) {
        const canEdit = hubbi.permissions.has('inventory.edit_all_subhubs');
        const ctx = hubbi.getContext();
        const isOwnSubHub = params.subHubId === ctx?.subHubId;
        const canEditOwn = hubbi.permissions.has('inventory.edit_own_subhub') && isOwnSubHub;

        if (!canEdit && !canEditOwn) {
            return {
                success: false,
                error: `No tienes permiso para modificar inventario de esta sucursal.`
            };
        }
    }

    const movementId = crypto.randomUUID();

    // Get or calculate cost
    let costAtMoment = params.unitCost || 0;
    if (!params.unitCost) {
        const items = await hubbi.db.query(
            `SELECT weighted_average_cost FROM com_hubbi_inventory_items WHERE id = ? `,
            [params.itemId],
            { moduleId: 'com.hubbi.inventory' }
        );
        costAtMoment = items.length > 0 ? (items[0] as Record<string, unknown>).weighted_average_cost as number : 0;
    }

    // Create movement record
    await hubbi.db.execute(`
    INSERT INTO com_hubbi_inventory_movements
                (id, item_id, location_id, type, reason, quantity, cost_at_moment, total_value,
                    document_type, document_number, document_uuid, created_by, sub_hub_id, period_id)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
        movementId,
        params.itemId,
        params.locationId,
        params.type,
        params.reason,
        params.quantity,
        costAtMoment,
        params.quantity * costAtMoment,
        params.documentType || null,
        params.documentNumber || null,
        params.documentUuid || null,
        params.createdBy,
        params.subHubId || null,
        periodId || null,
    ], { moduleId: 'com.hubbi.inventory' });

    // Update stock
    const stockDelta = params.type === 'IN' ? params.quantity :
        params.type === 'OUT' ? -params.quantity :
            params.quantity; // ADJUST can be positive or negative

    await hubbi.db.execute(`
    INSERT INTO com_hubbi_inventory_stock(item_id, location_id, quantity)
            VALUES(?, ?, ?)
    ON CONFLICT(item_id, location_id) DO UPDATE SET quantity = quantity + ?
                `, [params.itemId, params.locationId, stockDelta, stockDelta], { moduleId: 'com.hubbi.inventory' });

    // If it's an IN movement with a cost, recalculate weighted average
    if (params.type === 'IN' && params.unitCost) {
        await recalculateWeightedAverageCost(params.itemId, params.quantity, params.unitCost);
    }

    // Get new stock level
    const stockResult = await hubbi.db.query(
        `SELECT quantity FROM com_hubbi_inventory_stock WHERE item_id = ? AND location_id = ? `,
        [params.itemId, params.locationId],
        { moduleId: 'com.hubbi.inventory' }
    );
    const newStock = stockResult.length > 0 ? (stockResult[0] as Record<string, unknown>).quantity as number : 0;

    // Emit events
    emitInventoryEvent(params.type === 'IN' ? 'stock:increased' : 'stock:decreased', {
        itemId: params.itemId,
        locationId: params.locationId,
        quantity: params.quantity,
        reason: params.reason,
        movementId,
        newStock,
    });

    // Audit trail
    hubbi.audit?.({
        action: `stock_${params.type.toLowerCase()}`,
        entity: 'inventory_movement',
        entityId: movementId,
        description: `${params.type === 'IN' ? 'Entrada' : 'Salida'} de ${params.quantity} unidades - ${params.reason}`
    });

    return { success: true, movementId, newStock };
}

/**
 * Recalculate weighted average cost after an IN movement
 */
async function recalculateWeightedAverageCost(itemId: string, newQty: number, newCost: number): Promise<void> {
    // Get current total stock and cost
    const items = await hubbi.db.query(
        `SELECT weighted_average_cost FROM com_hubbi_inventory_items WHERE id = ? `,
        [itemId],
        { moduleId: 'com.hubbi.inventory' }
    );

    const stockResult = await hubbi.db.query(
        `SELECT SUM(quantity) as total FROM com_hubbi_inventory_stock WHERE item_id = ? `,
        [itemId],
        { moduleId: 'com.hubbi.inventory' }
    );

    const currentCost = items.length > 0 ? (items[0] as Record<string, unknown>).weighted_average_cost as number : 0;
    const currentQty = stockResult.length > 0 ? ((stockResult[0] as Record<string, unknown>).total as number) - newQty : 0;

    // Weighted Average = (Old Total Value + New Total Value) / (Old Qty + New Qty)
    const oldValue = currentQty * currentCost;
    const newValue = newQty * newCost;
    const totalQty = currentQty + newQty;

    const newWeightedCost = totalQty > 0 ? (oldValue + newValue) / totalQty : newCost;

    await hubbi.db.execute(
        `UPDATE com_hubbi_inventory_items SET weighted_average_cost = ?, last_cost = ? WHERE id = ? `,
        [newWeightedCost, newCost, itemId],
        { moduleId: 'com.hubbi.inventory' }
    );
}

// =============================================================================
// ITEM QUERIES
// =============================================================================

/**
 * Get item details by ID or SKU
 */
export async function getItem(params: { id?: string; sku?: string }): Promise<InventoryItem | null> {
    let sql = `SELECT * FROM com_hubbi_inventory_items WHERE `;
    const queryParams: unknown[] = [];

    if (params.id) {
        sql += `id = ? `;
        queryParams.push(params.id);
    } else if (params.sku) {
        sql += `sku = ? `;
        queryParams.push(params.sku);
    } else {
        return null;
    }

    const rows = await hubbi.db.query(sql, queryParams, { moduleId: 'com.hubbi.inventory' });
    return rows.length > 0 ? rows[0] as InventoryItem : null;
}

/**
 * Get items available for sale (not internal-use only)
 */
export async function getSellableItems(params?: {
    categoryId?: string;
    search?: string;
    limit?: number;
}): Promise<InventoryItem[]> {
    let sql = `
    SELECT * FROM com_hubbi_inventory_items 
    WHERE is_active = TRUE AND is_internal_use_only = FALSE
                `;
    const queryParams: unknown[] = [];

    if (params?.categoryId) {
        sql += ` AND category_id = ? `;
        queryParams.push(params.categoryId);
    }

    if (params?.search) {
        sql += ` AND(name LIKE ? OR sku LIKE ?)`;
        queryParams.push(`% ${params.search}% `, ` % ${params.search}% `);
    }

    sql += ` ORDER BY name LIMIT ? `;
    queryParams.push(params?.limit || 100);

    return await hubbi.db.query(sql, queryParams, { moduleId: 'com.hubbi.inventory' }) as InventoryItem[];
}

/**
 * Get kit components
 */
export async function getKitComponents(kitItemId: string): Promise<Array<{
    componentId: string;
    componentName: string;
    componentSku: string;
    quantity: number;
}>> {
    return await hubbi.db.query(`
    SELECT
            k.child_item_id as componentId,
                i.name as componentName,
                i.sku as componentSku,
                k.quantity
    FROM com_hubbi_inventory_kits k
    JOIN com_hubbi_inventory_items i ON k.child_item_id = i.id
    WHERE k.parent_item_id = ?
                `, [kitItemId], { moduleId: 'com.hubbi.inventory' });
}

// =============================================================================
// EVENT EMISSION
// =============================================================================

type InventoryEventType =
    | 'stock:increased'
    | 'stock:decreased'
    | 'reservation:created'
    | 'reservation:consumed'
    | 'reservation:cancelled'
    | 'item:created'
    | 'item:updated'
    | 'transfer:requested'
    | 'transfer:approved'
    | 'transfer:received';

/**
 * Emit an inventory event that other modules can listen to
 */
export function emitInventoryEvent(eventType: InventoryEventType, payload: Record<string, unknown>): void {
    window.dispatchEvent(new CustomEvent(`inventory:${eventType} `, {
        detail: {
            moduleId: 'com.hubbi.inventory',
            timestamp: new Date().toISOString(),
            ...payload,
        }
    }));

    if (import.meta.env.DEV) {
        console.log(`[Inventory Event] ${eventType} `, payload);
    }
}

// =============================================================================
// MODULE REGISTRATION
// =============================================================================

/**
 * Register all exposed methods with the Hubbi SDK
 * Called from onActivate()
 */
export function registerInventoryAPI(): void {
    if (!window.hubbi?.modules?.expose) {
        if (import.meta.env.DEV) {
            console.warn('[Inventory] hubbi.modules.expose not available, skipping API registration');
        }
        return;
    }

    // Stock queries
    window.hubbi.modules.expose('getStock', getStock);
    window.hubbi.modules.expose('checkAvailability', checkAvailability);
    window.hubbi.modules.expose('getLowStockItems', getLowStockItems);

    // Reservations
    window.hubbi.modules.expose('createReservation', createReservation);
    window.hubbi.modules.expose('consumeReservation', consumeReservation);
    window.hubbi.modules.expose('cancelReservation', cancelReservation);

    // Movements
    window.hubbi.modules.expose('recordMovement', recordMovement);

    // Item queries
    window.hubbi.modules.expose('getItem', getItem);
    window.hubbi.modules.expose('getSellableItems', getSellableItems);
    window.hubbi.modules.expose('getKitComponents', getKitComponents);

    // Fiscal Periods (shared API for other modules)
    window.hubbi.modules.expose('getCurrentPeriod', getCurrentPeriod);
    window.hubbi.modules.expose('isPeriodEditable', isPeriodEditableById);

    if (import.meta.env.DEV) {
        console.log('[Inventory] API registered with Hubbi SDK');
    }
}
