/**
 * Excel Export Component
 * 
 * Export inventory data to Excel/CSV format.
 * Supports: Stock report, Kardex, Valuation.
 */

import { useState } from 'react';
import { Download, FileSpreadsheet, X, Check } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';
import { useSubHubFilter } from '../hooks/useSubHubFilter';

interface ExcelExportProps {
    onClose: () => void;
}

const EXPORT_TYPES = [
    { value: 'stock', label: 'Reporte de Stock', description: 'Stock actual por bodega y producto' },
    { value: 'kardex', label: 'Kardex', description: 'Historial de movimientos por producto' },
    { value: 'valuation', label: 'Valorización', description: 'Stock con costos y valor total' },
    { value: 'low_stock', label: 'Stock Bajo', description: 'Productos por debajo del punto de reorden' },
];

export const ExcelExport = ({ onClose }: ExcelExportProps) => {
    const [exportType, setExportType] = useState<string>('stock');
    const [locationId, setLocationId] = useState<string>('all');
    const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [exporting, setExporting] = useState(false);
    const [exported, setExported] = useState(false);

    const { getEffectiveSubHubId } = useSubHubFilter();

    // Load locations
    useState(() => {
        const loadLocations = async () => {
            const data = await hubbi.db.query(
                `SELECT id, name FROM com_hubbi_inventory_locations WHERE is_active = TRUE`,
                [],
                { moduleId: 'com.hubbi.inventory' }
            );
            setLocations(data as Array<{ id: string; name: string }>);
        };
        loadLocations();
    });

    const handleExport = async () => {
        setExporting(true);

        let data: Record<string, unknown>[] = [];
        let filename = '';
        let headers: string[] = [];

        const subHubId = getEffectiveSubHubId();
        const subHubFilter = subHubId ? `AND l.sub_hub_id = '${subHubId}'` : '';
        const locationFilter = locationId !== 'all' ? `AND s.location_id = '${locationId}'` : '';

        if (exportType === 'stock') {
            filename = 'stock_report';
            headers = ['SKU', 'Producto', 'Bodega', 'Stock', 'Unidad', 'Mínimo', 'Reorden'];

            data = await hubbi.db.query(`
        SELECT 
          i.sku, i.name as producto, l.name as bodega, 
          s.quantity as stock, i.primary_unit as unidad,
          s.min_stock as minimo, s.reorder_point as reorden
        FROM com_hubbi_inventory_stock s
        JOIN com_hubbi_inventory_items i ON s.item_id = i.id
        JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
        WHERE i.is_active = TRUE ${locationFilter} ${subHubFilter}
        ORDER BY i.name
      `, [], { moduleId: 'com.hubbi.inventory' });

        } else if (exportType === 'kardex') {
            filename = 'kardex';
            headers = ['Fecha', 'SKU', 'Producto', 'Bodega', 'Tipo', 'Razón', 'Cantidad', 'Costo', 'Total'];

            const dateFilter = dateFrom && dateTo
                ? `AND m.created_at BETWEEN '${dateFrom}' AND '${dateTo}'`
                : '';

            data = await hubbi.db.query(`
        SELECT 
          m.created_at as fecha, i.sku, i.name as producto, l.name as bodega,
          m.type as tipo, m.reason as razon, m.quantity as cantidad,
          m.cost_at_moment as costo, m.total_value as total
        FROM com_hubbi_inventory_movements m
        JOIN com_hubbi_inventory_items i ON m.item_id = i.id
        JOIN com_hubbi_inventory_locations l ON m.location_id = l.id
        WHERE 1=1 ${locationFilter} ${subHubFilter} ${dateFilter}
        ORDER BY m.created_at DESC
        LIMIT 5000
      `, [], { moduleId: 'com.hubbi.inventory' });

        } else if (exportType === 'valuation') {
            filename = 'valorizacion';
            headers = ['SKU', 'Producto', 'Bodega', 'Stock', 'Costo Unitario', 'Valor Total'];

            data = await hubbi.db.query(`
        SELECT 
          i.sku, i.name as producto, l.name as bodega, s.quantity as stock,
          i.weighted_average_cost as costo_unitario,
          (s.quantity * i.weighted_average_cost) as valor_total
        FROM com_hubbi_inventory_stock s
        JOIN com_hubbi_inventory_items i ON s.item_id = i.id
        JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
        WHERE i.is_active = TRUE ${locationFilter} ${subHubFilter}
        ORDER BY valor_total DESC
      `, [], { moduleId: 'com.hubbi.inventory' });

        } else if (exportType === 'low_stock') {
            filename = 'stock_bajo';
            headers = ['SKU', 'Producto', 'Bodega', 'Stock Actual', 'Punto Reorden', 'Déficit'];

            data = await hubbi.db.query(`
        SELECT 
          i.sku, i.name as producto, l.name as bodega, s.quantity as stock_actual,
          s.reorder_point as punto_reorden,
          (s.reorder_point - s.quantity) as deficit
        FROM com_hubbi_inventory_stock s
        JOIN com_hubbi_inventory_items i ON s.item_id = i.id
        JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
        WHERE i.is_active = TRUE 
          AND s.quantity <= s.reorder_point 
          ${locationFilter} ${subHubFilter}
        ORDER BY deficit DESC
      `, [], { moduleId: 'com.hubbi.inventory' });
        }

        // Generate CSV
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map((_, i) => {
                const key = Object.keys(row)[i];
                const val = row[key];
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(','))
        ].join('\n');

        // Download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        // Log export
        await hubbi.db.execute(`
      INSERT INTO com_hubbi_inventory_export_logs (id, export_type, record_count, exported_by, exported_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
            crypto.randomUUID(),
            exportType,
            data.length,
            hubbi.getContext()?.userId || 'system',
            new Date().toISOString()
        ], { moduleId: 'com.hubbi.inventory' });

        setExporting(false);
        setExported(true);
        hubbi.notify(`Exportados ${data.length} registros`, 'success');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="text-blue-600" size={20} />
                        Exportar a Excel
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {exported ? (
                        <div className="text-center py-8">
                            <Check size={48} className="mx-auto text-green-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Exportación completada</h3>
                            <p className="text-gray-600">El archivo se ha descargado a tu computadora</p>
                        </div>
                    ) : (
                        <>
                            {/* Export type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de reporte</label>
                                <div className="space-y-2">
                                    {EXPORT_TYPES.map(t => (
                                        <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${exportType === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="exportType"
                                                value={t.value}
                                                checked={exportType === t.value}
                                                onChange={() => setExportType(t.value)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-medium">{t.label}</div>
                                                <div className="text-sm text-gray-500">{t.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Location filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
                                <select
                                    value={locationId}
                                    onChange={(e) => setLocationId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="all">Todas las bodegas</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date range for Kardex */}
                            {exportType === 'kardex' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
                        {exported ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!exported && (
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={16} />
                            {exporting ? 'Exportando...' : 'Exportar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
