import { useState, useEffect } from 'react';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Package, ShoppingCart } from 'lucide-react';

interface ProductStat {
    item_id: string;
    name: string;
    sku: string;
    total_quantity: number;
}

interface LowStockItem extends InventoryItem {
    current_stock: number;
    min_stock: number;
}

export const InventoryStats = () => {
    const [loading, setLoading] = useState(true);
    const [bestSellers, setBestSellers] = useState<ProductStat[]>([]);
    const [worstSellers, setWorstSellers] = useState<ProductStat[]>([]);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // 1. Fetch Movements for Sales (OUT + sale)
                // Note: We'll fetch last 30 days ideally, but for now generally
                // Using raw SQL for aggregation since SDK might not support complex group by yet
                const movements = await hubbi.db.query(`
                    SELECT 
                        m.item_id, 
                        i.name, 
                        i.sku, 
                        SUM(m.quantity) as total_quantity 
                    FROM com_hubbi_inventory_movements m
                    JOIN com_hubbi_inventory_items i ON m.item_id = i.id
                    WHERE m.type = 'OUT' AND m.reason = 'sale'
                    GROUP BY m.item_id, i.name, i.sku
                    ORDER BY total_quantity DESC
                `, []);

                const sorted = (movements as unknown as ProductStat[]);
                setBestSellers(sorted.slice(0, 5));
                setWorstSellers([...sorted].reverse().slice(0, 5));

                // 2. Fetch Low Stock Items
                // We need strict inventory with stock levels
                // Assuming simple query for now. In real app, consider joining stock table
                const stockItems = await hubbi.db.query(`
                    SELECT i.*, COALESCE(s.quantity, 0) as current_stock
                    FROM com_hubbi_inventory_items i
                    LEFT JOIN com_hubbi_inventory_stock s ON i.id = s.item_id
                    WHERE COALESCE(s.quantity, 0) <= i.min_stock
                    ORDER BY current_stock ASC
                    LIMIT 10
                `, []);
                setLowStock(stockItems as unknown as LowStockItem[]);

                // 3. Calculate Total Inventory Value
                const valuation = await hubbi.db.query(`
                    SELECT SUM(i.weighted_average_cost * s.quantity) as total_value
                    FROM com_hubbi_inventory_items i
                    JOIN com_hubbi_inventory_stock s ON i.id = s.item_id
                `, []);
                setTotalValue((valuation[0] as { total_value: number }).total_value || 0);

            } catch (err) {
                console.error("Error fetching stats:", err);
                hubbi.notify.error("Error al cargar estadísticas");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-hubbi-text-dim animate-pulse">
                <BarChart3 size={48} className="mb-4" />
                <p>Calculando métricas...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 overflow-y-auto h-full text-hubbi-text">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-hubbi-card p-4 rounded-xl border border-hubbi-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-hubbi-text-dim">Valor Total Inventario</p>
                        <h3 className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
                <div className="bg-hubbi-card p-4 rounded-xl border border-hubbi-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-hubbi-text-dim">Productos Más Vendidos</p>
                        <h3 className="text-2xl font-bold">{bestSellers.length > 0 ? bestSellers[0].name : 'N/A'}</h3>
                    </div>
                </div>
                <div className="bg-hubbi-card p-4 rounded-xl border border-hubbi-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-hubbi-text-dim">Alertas de Stock</p>
                        <h3 className="text-2xl font-bold">{lowStock.length} productos</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Best Sellers */}
                <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-hubbi-border bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-500" />
                            Más Vendidos
                        </h3>
                    </div>
                    <div className="p-4">
                        {bestSellers.length === 0 ? (
                            <p className="text-center text-hubbi-text-dim py-8">No hay datos de ventas aún.</p>
                        ) : (
                            <div className="space-y-4">
                                {bestSellers.map((item, idx) => (
                                    <div key={item.item_id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-xs text-hubbi-text-dim">{item.sku}</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-hubbi-primary">{item.total_quantity} un.</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-hubbi-border bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            Stock Crítico
                        </h3>
                    </div>
                    <div className="p-4">
                        {lowStock.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-green-500 gap-2">
                                <Package size={32} />
                                <p className="font-medium">Todo en orden</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lowStock.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                            <div>
                                                <p className="font-medium text-red-900 dark:text-red-200">{item.name}</p>
                                                <p className="text-xs text-red-600 dark:text-red-400">Min: {item.min_stock} | Actual: {item.current_stock}</p>
                                            </div>
                                        </div>
                                        <button className="text-xs bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                            Reabastecer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Worst Sellers - Optional, maybe less prominent */}
                <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-hubbi-border bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingDown size={18} className="text-orange-500" />
                            Menos Vendidos (Rotación Lenta)
                        </h3>
                    </div>
                    <div className="p-4">
                        {worstSellers.length === 0 ? (
                            <p className="text-center text-hubbi-text-dim py-8">No hay datos suficientes.</p>
                        ) : (
                            <div className="space-y-4">
                                {worstSellers.map((item, idx) => (
                                    <div key={item.item_id} className="flex items-center justify-between opacity-75">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-xs text-hubbi-text-dim">{item.sku}</p>
                                            </div>
                                        </div>
                                        <span className="font-mono text-gray-500">{item.total_quantity} un.</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
