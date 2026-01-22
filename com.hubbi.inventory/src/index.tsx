import './index.css';
import { useState, useEffect } from 'react';
import MainLayout from './Layout/MainLayout';
import { DashboardWidget } from './components/DashboardWidget';

import ProductsView from './pages/Products/TableView/ProductsView';
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
            if (subPath.includes('/warehouses')) return 'settings-warehouses';
            if (subPath.includes('/categories')) return 'settings-categories';
            if (subPath.includes('/groups')) return 'settings-groups';
            if (subPath.includes('/subgroups')) return 'settings-subgroups';
            if (subPath.includes('/custom-fields')) return 'settings-custom-fields';
            return 'settings';
        }

        return 'dashboard';
    };

    const [currentRoute, setCurrentRoute] = useState(getRoute);

    // NAVIGATION ISOLATION:
    // Only update route if we are the ACTIVE tab.
    // If we become active, we should sync to current URL.
    useEffect(() => {
        if (!props.isActive) return;

        const checkRoute = () => {
            // ... logic ...
            const newRoute = getRoute();
            if (newRoute !== currentRoute) {
                setCurrentRoute(newRoute);
            }
        };

        // Check immediately on mount/active
        checkRoute();

        const interval = setInterval(checkRoute, 100);
        window.addEventListener('popstate', checkRoute);
        return () => {
            clearInterval(interval);
            window.removeEventListener('popstate', checkRoute);
        };
    }, [currentRoute, props.isActive]);

    return (
        <InventoryProvider>
            <MainLayout>
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
                {currentRoute === 'settings' && <PlaceholderPage title="Configuración General" />}
                {currentRoute === 'settings-warehouses' && <PlaceholderPage title="Configuración de Bodegas" />}
                {currentRoute === 'settings-categories' && <PlaceholderPage title="Configuración de Categorías" />}
                {currentRoute === 'settings-groups' && <PlaceholderPage title="Configuración de Grupos" />}
                {currentRoute === 'settings-subgroups' && <PlaceholderPage title="Configuración de Subgrupos" />}
                {currentRoute === 'settings-custom-fields' && <PlaceholderPage title="Campos Personalizados" />}

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

        const result = await window.hubbi.db.query(
            'SELECT * FROM items WHERE sku = ? LIMIT 1',
            [sku],
            { moduleId: 'com.hubbi.inventory' }
        );
        return result[0] || null;
    }, 'com.hubbi.inventory');

    window.hubbi.modules.expose('getStockByItem', async (...args: unknown[]) => {
        const itemId = args[0] as string;
        if (!itemId) return [];

        const result = await window.hubbi.db.query(
            'SELECT * FROM stock WHERE item_id = ?',
            [itemId],
            { moduleId: 'com.hubbi.inventory' }
        );
        return result;
    }, 'com.hubbi.inventory');
}

export default InventoryModule;
