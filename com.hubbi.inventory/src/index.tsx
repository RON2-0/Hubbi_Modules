import './index.css';
import './hubbi-sdk.d';

// Exports for consumption by host app
export * from './components/ProductsTable';
export * from './components/ProductForm';
export * from './components/KitsManager';
export * from './components/MovementsHistory';
export * from './components/TransferDashboard';
export * from './components/RemissionNote';
export * from './components/VisualWarehouse';
export * from './components/MobileScanner';
export * from './components/PhysicalAudit';
export * from './components/StockAlertsPanel';
export * from './components/PeriodSelector';
export * from './components/SubHubSelector';
export * from './components/QuickAdjust';
export * from './components/ExcelImport';
export * from './components/ExcelExport';
export * from './hooks/useInventoryActions';
export * from './hooks/useInventoryMovements';
export * from './hooks/useStockAlerts';
export * from './hooks/useFiscalPeriods';
export * from './hooks/useSubHubFilter';
export * from './integrations/dte-integration';
export * from './types/inventory';
export * from './logic/inventory-core';

// Inter-module API exports
export * from './api/inventory-api';

// Types and schemas
export * from './types/schemas';

// Utilities
export * from './utils/export-utils';

// Import for internal use
import { registerInventoryAPI } from './api/inventory-api';
import { StockAlertsPanel } from './components/StockAlertsPanel';
import { setupInventoryEventListeners } from './logic/InventoryEvents';

// Settings Tab Component
export const InventorySettingsTab = () => {
  return (
    <div className="inventory-settings p-4">
      <h2 className="text-lg font-bold">Configuración de Inventario</h2>
      <p className="text-gray-500">Próximamente: Ajustes de costos, prefijos y permisos.</p>
    </div>
  );
};

// Dashboard Widget - Stock Alerts Summary
export const InventoryDashboardWidget = () => {
  return <StockAlertsPanel compact />;
};

// Sidebar Navigation Component
export const InventorySidebar = () => {
  // The Core should already hide this if user doesn't have access,
  // but we add a defensive check here too
  const hasAccess = window.hubbi?.permissions?.has?.('inventory:access') ?? true;

  if (!hasAccess) return null;

  const navigate = () => window.hubbi?.navigate?.('/inventory');
  return (
    <button onClick={navigate} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2">
      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <span>Inventario</span>
    </button>
  );
};

// Entry point when module activates
export const onActivate = async () => {
  if (import.meta.env.DEV) {
    console.log('[Inventory] Module Activated');
  }

  // Register Settings Tab Widget
  if (window.hubbi?.widgets?.register) {
    // Settings tab
    window.hubbi.widgets.register({
      slotName: 'settings_tab',
      moduleId: 'com.hubbi.inventory',
      component: InventorySettingsTab,
      priority: 10
    });

    // Dashboard widget (stock alerts)
    window.hubbi.widgets.register({
      slotName: 'dashboard_widget',
      moduleId: 'com.hubbi.inventory',
      component: InventoryDashboardWidget,
      priority: 20
    });

    // Sidebar navigation item
    window.hubbi.widgets.register({
      slotName: 'sidebar_item',
      moduleId: 'com.hubbi.inventory',
      component: InventorySidebar,
      priority: 30
    });
  }

  // Register Inter-Module API
  registerInventoryAPI();

  // Initialize stock alerts monitoring (send persistent notifications for critical stock)
  initializeStockAlertNotifications();

  // Listen for cross-module events (Billing, etc.)
  setupInventoryEventListeners();
};

// Check for low stock and send persistent notifications
async function initializeStockAlertNotifications() {
  if (!window.hubbi?.db?.query || !window.hubbi?.sendNotification) return;

  try {
    const lowStockItems = await window.hubbi.db.query(`
      SELECT i.name, s.quantity, s.reorder_point, l.name as location_name
      FROM com_hubbi_inventory_stock s
      JOIN com_hubbi_inventory_items i ON s.item_id = i.id
      JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
      WHERE s.quantity <= s.min_stock AND i.is_active = TRUE
      LIMIT 5
    `, [], { moduleId: 'com.hubbi.inventory' });

    if (lowStockItems.length > 0) {
      await window.hubbi.sendNotification({
        title: '⚠️ Stock Crítico',
        message: `${lowStockItems.length} productos requieren reabastecimiento urgente`,
        category: 'inventory',
        severity: 'warning',
        actionUrl: '/inventory/alerts'
      });
    }
  } catch {
    // Silent fail if not available
  }
}

// Module metadata for programmatic access
export const moduleInfo = {
  id: 'com.hubbi.inventory',
  name: 'Hubbi Inventory & WMS',
  version: '1.0.0',

  // Events this module emits (for documentation)
  emittedEvents: [
    'inventory:stock:increased',
    'inventory:stock:decreased',
    'inventory:reservation:created',
    'inventory:reservation:consumed',
    'inventory:reservation:cancelled',
    'inventory:item:created',
    'inventory:item:updated',
    'inventory:transfer:requested',
    'inventory:transfer:approved',
    'inventory:transfer:received',
  ],

  // Methods exposed to other modules via hubbi.modules.call()
  exposedMethods: [
    'getStock',
    'checkAvailability',
    'getLowStockItems',
    'createReservation',
    'consumeReservation',
    'cancelReservation',
    'recordMovement',
    'getItem',
    'getSellableItems',
    'getKitComponents',
    'getCurrentPeriod',
    'isPeriodEditable',
  ],
};
