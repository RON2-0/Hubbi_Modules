import './index.css';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import MainLayout from './Layout/MainLayout';
import { DashboardWidget } from './components/DashboardWidget';

import ProductsView from './pages/Products/TableView/ProductsView';
import SettingsView from './pages/Settings/SettingsView';
import { PlaceholderPage } from './components/PlaceholderPage';

// ============================================
// MAIN MODULE COMPONENT
// ============================================
// ============================================
// MAIN MODULE COMPONENT
// ============================================

import { InventoryProvider } from './context/InventoryContext';

function InventoryModule(props: { isActive?: boolean }) {
    // URL-based routing
    // Extract sub-path from window.location.pathname
    // Format: /modules/com.hubbi.inventory/[route]
    const getRoute = () => {
        if (typeof window === 'undefined') return 'dashboard';
        const path = window.location.pathname;
        const prefix = '/app/com.hubbi.inventory';

        if (path === prefix || path === prefix + '/') return 'dashboard';

        // Remove prefix to get the route
        const subPath = path.replace(prefix, '');
        // handle /products, /settings/warehouses, etc.

        if (subPath.startsWith('/products')) return 'products';
        if (subPath.startsWith('/purchases')) return 'purchases';
        if (subPath.startsWith('/movements')) return 'movements';
        if (subPath.startsWith('/stock')) return 'stock';
        if (subPath.startsWith('/labeling')) return 'labeling';
        if (subPath.startsWith('/kardex')) return 'kardex';
        if (subPath.startsWith('/wms-admin')) return 'wms-admin';

        if (subPath.startsWith('/settings')) {
            if (subPath.includes('/general')) return 'settings-general';
            if (subPath.includes('/warehouses')) return 'settings-warehouses';
            if (subPath.includes('/categories')) return 'settings-categories';
            if (subPath.includes('/groups')) return 'settings-groups';
            if (subPath.includes('/subgroups')) return 'settings-subgroups';
            if (subPath.includes('/custom-fields')) return 'settings-custom-fields';
            return 'settings-general';
        }

        return 'dashboard';
    };

    const [currentRoute, setCurrentRoute] = useState(getRoute);
    const [accessDenied, setAccessDenied] = useState(false);
    const [loading, setLoading] = useState(true);

    // ACCESS CONTROL & NAVIGATION
    useEffect(() => {
        const checkAccess = async () => {
            if (typeof window === 'undefined') return;

            try {
                const stored = await window.hubbi.settings.get('allowedDepartments', 'com.hubbi.inventory');
                const allowedIds: number[] = stored ? JSON.parse(stored) : [];

                if (allowedIds.length > 0) {
                    // Get department from context
                    const context = window.hubbi.getContext() as any;
                    const userDept = context.departmentId || context.department_id;

                    if (userDept && !allowedIds.includes(userDept)) {
                        setAccessDenied(true);
                    }
                }
            } catch (e) {
                console.error("Access check failed", e);
            } finally {
                setLoading(false);
            }
        };

        checkAccess();

        if (!props.isActive || accessDenied) return;

        const checkRoute = () => {
            const newRoute = getRoute();
            if (newRoute !== currentRoute) {
                setCurrentRoute(newRoute);
            }
        };

        checkRoute();
        const interval = setInterval(checkRoute, 100);
        window.addEventListener('popstate', checkRoute);
        return () => {
            clearInterval(interval);
            window.removeEventListener('popstate', checkRoute);
        };
    }, [currentRoute, props.isActive, accessDenied]);

    if (loading) return null;

    if (accessDenied) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-hubbi-background text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="text-2xl font-bold text-hubbi-text mb-2">Acceso Restringido</h1>
                <p className="text-hubbi-dim max-w-md">
                    Tu departamento no tiene permisos autorizados para acceder al módulo de Inventario.
                    Contacta al administrador para solicitar acceso.
                </p>
            </div>
        );
    }

    return (
        <InventoryProvider>
            <MainLayout>
                {/* ... existing routes ... */}
                {/* DASHBOARD: Default View */}
                {currentRoute === 'dashboard' && (
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-hubbi-text mb-4">Dashboard de Inventario</h1>
                        <DashboardWidget />
                    </div>
                )}

                {/* PRODUCTS: Table View */}
                {currentRoute === 'products' && <ProductsView />}

                {/* PLACEHOLDERS for other sections */}
                {currentRoute === 'purchases' && <PlaceholderPage title="Compras" description="Gestión de ingresos y órdenes de compra." />}
                {currentRoute === 'movements' && <PlaceholderPage title="Movimientos" description="Historial y registro de movimientos." />}
                {currentRoute === 'stock' && <PlaceholderPage title="Existencias" description="Reporte detallado de stock por bodega." />}
                {currentRoute === 'labeling' && <PlaceholderPage title="Etiquetación" description="Generación de códigos de barra y etiquetas." />}
                {currentRoute === 'kardex' && <PlaceholderPage title="Kardex" description="Trazabilidad completa de productos." />}
                {currentRoute === 'wms-admin' && <PlaceholderPage title="Administración WMS" description="Mapa interactivo y gestión de ubicaciones." />}

                {/* SETTINGS */}
                {currentRoute.startsWith('settings') && (
                    <SettingsView currentRoute={currentRoute} />
                )}

            </MainLayout>
        </InventoryProvider>
    );
}

// ============================================
// MODULE REGISTRATION
// ============================================
if (typeof window !== 'undefined' && window.hubbi) {
    // 1. Register Module Entry Point
    window.hubbi.register('com.hubbi.inventory', InventoryModule);

    // 2. Register Dashboard Widget
    window.hubbi.widgets.register({
        slotName: 'dashboard_main',
        moduleId: 'com.hubbi.inventory',
        component: DashboardWidget,
        priority: 20
    });

    // 3. Expose Public API for other modules
    window.hubbi.modules.expose('getItemBySku', async (...args: unknown[]) => {
        const sku = args[0] as string;
        if (!sku) return null;

        const context = window.hubbi.getContext();
        const subHubId = context?.subHubId;

        let sql = 'SELECT * FROM items WHERE sku = ? LIMIT 1';
        const params: any[] = [sku];

        if (subHubId) {
            sql = `
                SELECT DISTINCT i.* 
                FROM items i
                INNER JOIN stock s ON i.id = s.item_id
                INNER JOIN warehouses w ON s.warehouse_id = w.id
                WHERE i.sku = ? AND w.sub_hub_id = ?
                LIMIT 1
            `;
            params.push(subHubId);
        }

        const result = await window.hubbi.db.query(sql, params, { moduleId: 'com.hubbi.inventory' });
        return result[0] || null;
    }, 'com.hubbi.inventory');

    window.hubbi.modules.expose('getStockByItem', async (...args: unknown[]) => {
        const itemId = args[0] as string;
        if (!itemId) return [];

        const context = window.hubbi.getContext();
        const subHubId = context?.subHubId;

        let sql = 'SELECT * FROM stock WHERE item_id = ?';
        const params: any[] = [itemId];

        if (subHubId) {
            sql = `
                SELECT s.* 
                FROM stock s
                INNER JOIN warehouses w ON s.warehouse_id = w.id
                WHERE s.item_id = ? AND w.sub_hub_id = ?
            `;
            params.push(subHubId);
        }

        const result = await window.hubbi.db.query(sql, params, { moduleId: 'com.hubbi.inventory' });
        return result;
    }, 'com.hubbi.inventory');
}

export default InventoryModule;
