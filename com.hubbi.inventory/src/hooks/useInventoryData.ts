import { useEffect, useState, useCallback } from 'react';
import { InventoryItem } from '../types/inventory';
import { useInventoryStore } from '../context/InventoryContext';

// [BUILD-FIX] Enforcing any-types for DB mapping
export function useInventoryData() {
    const [data, setData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { selectedSubHubId } = useInventoryStore();

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);

            let sql = `SELECT * FROM items WHERE is_active = TRUE`;
            const params = [];

            if (selectedSubHubId) {
                // Filter items that have stock or are linked to the subhub via warehouses
                // refactored to use EXISTS to avoid SELECT DISTINCT on JSON columns which fails in Postgres
                sql = `
                    SELECT * FROM items i
                    WHERE i.is_active = TRUE
                    AND EXISTS (
                        SELECT 1 
                        FROM stock s 
                        JOIN warehouses w ON s.warehouse_id = w.id
                        WHERE s.item_id = i.id AND w.sub_hub_id = ?
                    )
                    ORDER BY i.name ASC
                `;
                params.push(selectedSubHubId);
            } else {
                sql += ` ORDER BY name ASC`;
            }

            const items = await window.hubbi.db.query<any>(sql, params, { moduleId: 'com.hubbi.inventory' });

            // Parse JSON fields if necessary (SQLite returns string for JSON)
            const parsedItems: InventoryItem[] = items.map((item: any) => {
                const baseAttributes = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : (item.attributes || {});
                const assetMeta = typeof item.asset_meta === 'string' ? JSON.parse(item.asset_meta) : (item.asset_meta || {});

                return {
                    ...item,
                    // Ensure boolean conversion if DB returns 0/1
                    is_saleable: Boolean(item.is_saleable),
                    is_purchasable: Boolean(item.is_purchasable),
                    is_tax_exempt: Boolean(item.is_tax_exempt),
                    has_expiration: Boolean(item.has_expiration),
                    has_warranty: Boolean(item.has_warranty),

                    // Map legacy/db fields to new interface
                    kind: (item.type?.toUpperCase() as any) || 'PRODUCT',
                    status: (item.is_active ? 'ACTIVE' : 'INACTIVE') as any,

                    // Parse JSON strings to objects
                    attributes: { ...baseAttributes, ...assetMeta },
                };
            });

            setData(parsedItems);
            setError(null);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            setError('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    }, [selectedSubHubId]);

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
