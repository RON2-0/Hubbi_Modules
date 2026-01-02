import { useState, useEffect, useCallback } from 'react';
import { hubbi } from '../hubbi-sdk.d';

interface StockAlert {
    item_id: string;
    item_name: string;
    item_sku: string;
    location_id: string;
    location_name: string;
    current_qty: number;
    min_stock: number;
    reorder_point: number;
    severity: 'critical' | 'warning' | 'ok';
}

export const useStockAlerts = () => {
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const checkAlerts = useCallback(async () => {
        setLoading(true);

        // Query items where current stock is at or below minimum/reorder point
        const data = await hubbi.data.query(`
            SELECT 
                s.item_id,
                s.location_id,
                s.quantity as current_qty,
                s.min_stock,
                s.reorder_point,
                i.name as item_name,
                i.sku as item_sku,
                l.name as location_name
            FROM com_hubbi_inventory_stock s
            JOIN com_hubbi_inventory_items i ON s.item_id = i.id
            LEFT JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
            WHERE s.quantity <= s.reorder_point OR s.quantity <= s.min_stock
            ORDER BY (s.min_stock - s.quantity) DESC
        `);

        if (data && Array.isArray(data)) {
            const processedAlerts: StockAlert[] = data.map(row => ({
                ...row,
                severity: row.current_qty <= row.min_stock
                    ? 'critical'
                    : row.current_qty <= row.reorder_point
                        ? 'warning'
                        : 'ok'
            }));
            setAlerts(processedAlerts);
        }

        setLastCheck(new Date());
        setLoading(false);
    }, []);

    // Check on mount
    useEffect(() => {
        checkAlerts();
    }, [checkAlerts]);

    // Get counts by severity
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    return {
        alerts,
        criticalCount,
        warningCount,
        loading,
        lastCheck,
        refresh: checkAlerts
    };
};
