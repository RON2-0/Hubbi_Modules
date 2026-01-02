/**
 * DTE Integration Module
 * Provides hooks and utilities for connecting inventory movements with fiscal documents (El Salvador)
 */

import { hubbi } from '../hubbi-sdk.d';
import { InventoryMovement } from '../types/inventory';

// Event types that can be emitted to external modules
export type DTEEventType =
    | 'INVENTORY_IN_PURCHASE'      // Entrada por compra (asociar a Crédito Fiscal)
    | 'INVENTORY_OUT_SALE'         // Salida por venta (asociar a Factura/CCF)
    | 'INVENTORY_TRANSFER'         // Traslado (asociar a Nota de Remisión)
    | 'INVENTORY_ADJUSTMENT';      // Ajuste (puede requerir documentación interna)

export interface DTEEventPayload {
    eventType: DTEEventType;
    movement: InventoryMovement;
    metadata: {
        itemName?: string;
        itemSku?: string;
        locationName?: string;
        totalValue?: number;
    };
}

/**
 * Emits an inventory event to be captured by the Billing/DTE module
 * Uses a custom event system that the core Hubbi app can relay to other modules
 */
export const emitDTEEvent = async (payload: DTEEventPayload): Promise<void> => {
    // In real implementation, this would use hubbi.events.emit or similar
    // For now, we store it in a pending events table for the DTE module to pick up

    const eventId = crypto.randomUUID();

    await hubbi.data.execute(`
        INSERT INTO com_hubbi_inventory_dte_events (id, event_type, movement_id, payload, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?)
    `, [
        eventId,
        payload.eventType,
        payload.movement.id,
        JSON.stringify(payload),
        new Date().toISOString()
    ]);

    console.log(`[DTE Integration] Event emitted: ${payload.eventType} for movement ${payload.movement.id}`);
};

/**
 * Links an existing movement to a DTE document after it's been generated
 */
export const linkMovementToDTE = async (
    movementId: string,
    dteData: {
        documentType: string;  // 'factura', 'ccf', 'nota_remision', etc.
        documentNumber: string;
        documentUUID?: string; // UUID del DTE del Ministerio de Hacienda
    }
): Promise<void> => {
    await hubbi.data.execute(`
        UPDATE com_hubbi_inventory_movements 
        SET document_type = ?, document_number = ?, document_uuid = ?
        WHERE id = ?
    `, [dteData.documentType, dteData.documentNumber, dteData.documentUUID, movementId]);

    hubbi.notify.success(`Movimiento vinculado a ${dteData.documentType} #${dteData.documentNumber}`);
};

/**
 * Get pending DTE events for processing by external module
 */
export const getPendingDTEEvents = async (): Promise<DTEEventPayload[]> => {
    const data = await hubbi.data.query(`
        SELECT payload FROM com_hubbi_inventory_dte_events 
        WHERE status = 'pending' 
        ORDER BY created_at ASC
        LIMIT 50
    `);

    return (data || []).map(row => JSON.parse(row.payload));
};

/**
 * Mark DTE event as processed
 */
export const markDTEEventProcessed = async (movementId: string): Promise<void> => {
    await hubbi.data.execute(`
        UPDATE com_hubbi_inventory_dte_events 
        SET status = 'processed' 
        WHERE movement_id = ?
    `, [movementId]);
};
