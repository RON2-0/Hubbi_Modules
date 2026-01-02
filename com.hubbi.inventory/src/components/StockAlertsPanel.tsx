import { AlertTriangle, Bell, RefreshCw } from 'lucide-react';
import { useStockAlerts } from '../hooks/useStockAlerts';

interface StockAlertsPanelProps {
    compact?: boolean;
}

export const StockAlertsPanel = ({ compact = false }: StockAlertsPanelProps) => {
    const { alerts, criticalCount, warningCount, loading, lastCheck, refresh } = useStockAlerts();
    const displayAlerts = compact ? alerts.slice(0, 3) : alerts;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={20} className="text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Alertas de Stock</h3>
                    {criticalCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {criticalCount}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {warningCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className={`${compact ? 'max-h-32' : 'max-h-64'} overflow-auto`}>
                {displayAlerts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No hay alertas de stock</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {displayAlerts.map((alert, idx) => (
                            <div key={idx} className={`p-3 flex items-center gap-3 ${alert.severity === 'critical' ? 'bg-red-50' :
                                alert.severity === 'warning' ? 'bg-yellow-50' : ''
                                }`}>
                                <AlertTriangle size={18} className={
                                    alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                                } />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{alert.item_name}</div>
                                    <div className="text-xs text-gray-500">
                                        {alert.location_name || 'Sin ubicación'} • Stock: {alert.current_qty} / Mínimo: {alert.min_stock}
                                    </div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${alert.severity === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {alert.severity === 'critical' ? 'CRÍTICO' : 'BAJO'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {lastCheck && (
                <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
                    Última verificación: {lastCheck.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};
