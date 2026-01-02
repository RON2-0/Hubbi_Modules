/**
 * Plugin Entry Point for Hubbi Module System
 * This component handles plugin registration with the PluginRenderer
 */
import { onActivate } from './index';

// The main component to render when this plugin is loaded
const InventoryApp = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Hubbi Inventory &amp; WMS</h1>
            <p className="text-gray-600">
                Módulo de inventario cargado exitosamente. Configuración en progreso...
            </p>
        </div>
    );
};

/**
 * Register this plugin with the Hubbi Core
 * This function must be called immediately when the plugin script loads
 */
function registerPlugin() {
    const PLUGIN_ID = 'com.hubbi.inventory';

    // Check if window.hubbi exists and has the register method
    if (typeof window !== 'undefined' && window.hubbi && typeof window.hubbi.register === 'function') {
        // Use the SDK's register method - this handles both pluginRegistry and event dispatching
        window.hubbi.register(PLUGIN_ID, InventoryApp);

        // Call the onActivate lifecycle hook
        if (typeof onActivate === 'function') {
            onActivate().catch((err: Error) => {
                console.error('[Inventory Module] Activation error:', err);
            });
        }

        console.log(`[PluginEntry] Plugin '${PLUGIN_ID}' registered successfully`);
    } else {
        console.error('[PluginEntry] window.hubbi.register not found. Cannot register plugin.');
    }
}

// Auto-execute registration when this module loads
registerPlugin();

export default InventoryApp;
