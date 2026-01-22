import { useEffect, useState, useRef } from 'react';
import { Package, ArrowRight, AlertTriangle } from 'lucide-react';

export function DashboardWidget() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [stats, setStats] = useState({ total: 0, lowStock: 0 });

    // Observe widget size for responsive layout
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Fetch inventory stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Low stock count (items below min_stock)
                const lowStockResult = await window.hubbi.db.query<{ count: number }>(
                    `SELECT COUNT(*) as count FROM stock s
           JOIN items i ON s.item_id = i.id
           WHERE s.quantity < s.min_stock AND s.min_stock > 0`,
                    [],
                    { moduleId: 'com.hubbi.inventory' }
                );

                setStats({
                    total: 0,
                    lowStock: lowStockResult[0]?.count || 0
                });
            } catch (e) {
                console.error('[Inventory Widget] Error fetching stats:', e);
            }
        };

        fetchStats();

        // Subscribe to data changes
        const unsubscribe = window.hubbi.events.on('plugin:data_changed', (event: unknown) => {
            if (
                typeof event === 'object' &&
                event !== null &&
                'table' in event &&
                ((event as { table: string }).table.endsWith('items') ||
                    (event as { table: string }).table.endsWith('stock'))
            ) {
                fetchStats();
            }
        });

        return unsubscribe;
    }, []);

    // Responsive layout logic
    const isSmallSquare = size.width < 160 && size.height < 160;
    const isShort = size.height < 140 && size.width >= 200;

    return (
        <div
            ref={containerRef}
            className="h-full w-full cursor-pointer overflow-hidden flex flex-col min-h-0 transition-colors duration-300"
        >
            <div
                className={`h-full w-full flex ${isSmallSquare ? 'items-center justify-center p-2' : isShort ? 'flex-row items-center p-2 sm:p-3 md:p-4' : 'flex-col p-2 sm:p-3 md:p-4'} hover:brightness-110 transition-all`}
                style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05))' }}
            >

                {/* ICON AND COUNTER */}
                <div className={`flex ${isSmallSquare ? 'items-center justify-center' : 'items-center'} ${isShort ? 'mb-0 mr-4' : isSmallSquare ? '' : 'mb-2 min-h-0'}`}>
                    <div
                        className={`rounded-lg aspect-square flex items-center justify-center ${isSmallSquare ? 'p-3' : 'p-2'}`}
                        style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}
                    >
                        <Package className={isSmallSquare ? 'w-8 h-8' : 'w-6 h-6'} />
                    </div>
                </div>

                {/* TEXT */}
                {!isSmallSquare && (
                    <div className="flex-1 flex flex-col justify-center">
                        <h3 className={`font-bold text-white truncate ${isShort ? 'text-base' : 'text-lg'}`}>
                            Inventario
                        </h3>
                        {!isShort && (
                            <p className="text-hubbi-dim text-xs line-clamp-2 mt-1">
                                Gestión de productos, servicios y activos.
                            </p>
                        )}
                    </div>
                )}

                {/* LOW STOCK ALERT */}
                {!isSmallSquare && !isShort && stats.lowStock > 0 && size.height > 160 && (
                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: '#fbbf24' }}>
                        <AlertTriangle className="w-4 h-4" />
                        <span>{stats.lowStock} productos bajo stock</span>
                    </div>
                )}

                {/* ACTION BUTTON */}
                {!isSmallSquare && !isShort && size.height > 180 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center text-xs font-bold uppercase tracking-widest group" style={{ color: '#fbbf24' }}>
                            Abrir <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
