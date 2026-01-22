import { useEffect, useState, useCallback } from 'react';
import { InventoryItem } from '../types/inventory';

export function useInventoryData() {
    const [data, setData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            // Query compatible with both SQLite and Postgres via SDK
            // Note: In a real implementation we would join with UOMs, Stocks, etc.
            // For now, fetching basic item data.
            const items = await window.hubbi.db.query<InventoryItem>(
                `SELECT * FROM items WHERE is_active = TRUE ORDER BY name ASC`,
                [],
                { moduleId: 'com.hubbi.inventory' }
            );

            // Parse JSON fields if necessary (SQLite returns string for JSON)
            const parsedItems = items.map(item => ({
                ...item,
                // Ensure boolean conversion if DB returns 0/1
                is_active: Boolean(item.is_active),
                is_saleable: Boolean(item.is_saleable),
                is_purchasable: Boolean(item.is_purchasable),
                is_tax_exempt: Boolean(item.is_tax_exempt),
                has_expiration: Boolean(item.has_expiration),
                has_warranty: Boolean(item.has_warranty),
                // Parse JSON strings to objects if they come as strings
                attributes: typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes,
                asset_meta: typeof item.asset_meta === 'string' ? JSON.parse(item.asset_meta) : item.asset_meta,
            }));

            setData(parsedItems);
            setError(null);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            setError('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();

        // Subscribe to real-time changes
        const unsubscribe = window.hubbi.events.on('plugin:data_changed', (event: unknown) => {
            if (
                typeof event === 'object' &&
                event !== null &&
                'table' in event &&
                (event as { table: string }).table.endsWith('items')
            ) {
                fetchItems();
            }
        });

        return unsubscribe;
    }, [fetchItems]);

    return { data, loading, error, refresh: fetchItems };
}
