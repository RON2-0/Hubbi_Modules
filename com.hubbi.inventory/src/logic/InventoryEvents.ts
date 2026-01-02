/**
 * Inventory Event Listeners
 * 
 * Central place to subscribe to cross-module events (e.g., Billing, Purchases).
 * This ensures Inventory reacts to external changes without tight coupling.
 */

import { hubbi } from '../hubbi-sdk.d';

export function setupInventoryEventListeners() {
    console.log('[Inventory] Setting up event listeners...');

    // Listener: When an invoice is created in Billing module
    window.addEventListener('billing:invoice_created', handleInvoiceCreated as EventListener);
}

export function teardownInventoryEventListeners() {
    window.removeEventListener('billing:invoice_created', handleInvoiceCreated as EventListener);
}

/**
 * Handles stock deduction when an invoice is created
 * Payload expected: { detail: { items: [{ item_id, quantity, location_id? }] } }
 */
async function handleInvoiceCreated(event: Event) {
    const customEvent = event as CustomEvent;
    const { invoiceId, items } = customEvent.detail;

    if (!items || !Array.isArray(items)) return;

    console.log(`[Inventory] Processing invoice #${invoiceId} with ${items.length} items.`);

    // We process each item sequentially to ensure atomicity per item
    // In a real scenario, this should be a single transaction if possible
    for (const item of items) {
        if (!item.item_id || !item.quantity) continue;

        try {
            // 1. Determine location (Default to Main Warehouse if not specified)
            // Ideally, the invoice should specify where it's sold from.
            const locationId = item.location_id || await getDefaultLocationId();

            // 2. Record Movement (OUT)
            await hubbi.data.create({
                table: 'com_hubbi_inventory_movements',
                data: {
                    id: crypto.randomUUID(),
                    item_id: item.item_id,
                    location_id: locationId,
                    type: 'OUT',
                    reason: 'sale',
                    quantity: item.quantity,
                    document_type: 'invoice',
                    document_uuid: invoiceId, // Link to billing invoice
                    created_by: hubbi.getContext()?.userId || 'system',
                    created_at: new Date().toISOString()
                },
                options: { strategy: 'online_first' }
            });

            // 3. Update Stock Table (Decrement)
            await hubbi.db.execute(
                `UPDATE com_hubbi_inventory_stock 
                 SET quantity = quantity - $1, updated_at = NOW()
                 WHERE item_id = $2 AND location_id = $3`,
                [item.quantity, item.item_id, locationId],
                { moduleId: 'com.hubbi.inventory' }
            );

            // 4. Emit internal event for UI updates
            // Use window.dispatchEvent because hubbi.events.emit is not in SDK
            window.dispatchEvent(new CustomEvent('inventory:stock:decreased', {
                detail: {
                    itemId: item.item_id,
                    locationId: locationId,
                    delta: item.quantity
                }
            }));

        } catch (err) {
            console.error(`[Inventory] Failed to deduct stock for item ${item.item_id}:`, err);
            hubbi.notify(`Error al descontar inventario: ${item.item_name || item.item_id}`, 'error');
        }
    }

    hubbi.notify(`Inventario actualizado por Venta #${invoiceId}`, 'info');
}

/**
 * Helper to get a default location ID if none provided
 */
async function getDefaultLocationId(): Promise<string> {
    // Try cache first
    const items = await hubbi.db.query(
        `SELECT id FROM com_hubbi_inventory_locations WHERE kind = 'warehouse' LIMIT 1`,
        [],
        { moduleId: 'com.hubbi.inventory' }
    );
    return items?.[0]?.id || 'default_warehouse';
}
