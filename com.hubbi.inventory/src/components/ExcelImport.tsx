/**
 * Excel Import Component
 * 
 * Import inventory from Excel file.
 * Supports: Initial load, adjustments, or full sync.
 */

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, Check, Download } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';
import { useFiscalPeriods } from '../hooks/useFiscalPeriods';
import { useSubHubFilter } from '../hooks/useSubHubFilter';

interface ExcelImportProps {
    onClose: () => void;
    onSuccess?: (count: number) => void;
}

interface ImportRow {
    sku: string;
    name?: string;
    quantity: number;
    location?: string;
    cost?: number;
    error?: string;
}

const IMPORT_MODES = [
    { value: 'initial', label: 'Carga Inicial', description: 'Crear productos y establecer stock inicial' },
    { value: 'adjust', label: 'Ajuste Masivo', description: 'Ajustar cantidades existentes (+/-)' },
    { value: 'sync', label: 'Sincronización', description: 'Reemplazar stock actual con valores del Excel' },
];

export const ExcelImport = ({ onClose, onSuccess }: ExcelImportProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<string>('initial');
    const [locationId, setLocationId] = useState<string>('');
    const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
    const [parsedData, setParsedData] = useState<ImportRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [result, setResult] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });

    const { currentPeriod, isPeriodEditable } = useFiscalPeriods();
    const { getEffectiveSubHubId, canEditSubHub } = useSubHubFilter();

    // Load locations on mount
    useState(() => {
        const loadLocations = async () => {
            const data = await hubbi.db.query(
                `SELECT id, name FROM com_hubbi_inventory_locations WHERE is_active = TRUE`,
                [],
                { moduleId: 'com.hubbi.inventory' }
            );
            setLocations(data as Array<{ id: string; name: string }>);
            if (data.length > 0) {
                setLocationId((data[0] as { id: string }).id);
            }
        };
        loadLocations();
    });

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // Parse Excel/CSV
        // Note: In production, use a library like xlsx or papaparse
        // This is a simplified CSV parser for demonstration
        const text = await selectedFile.text();
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

        const skuIndex = headers.findIndex(h => h.includes('sku') || h.includes('codigo'));
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('nombre'));
        const qtyIndex = headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('cantidad'));
        const costIndex = headers.findIndex(h => h.includes('cost') || h.includes('costo') || h.includes('precio'));

        if (skuIndex === -1 || qtyIndex === -1) {
            hubbi.notify('El archivo debe tener columnas SKU y Cantidad', 'error');
            return;
        }

        const rows: ImportRow[] = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            if (!cols[skuIndex]) continue;

            rows.push({
                sku: cols[skuIndex],
                name: nameIndex >= 0 ? cols[nameIndex] : undefined,
                quantity: parseFloat(cols[qtyIndex]) || 0,
                cost: costIndex >= 0 ? parseFloat(cols[costIndex]) : undefined,
            });
        }

        setParsedData(rows);
        setStep('preview');
    }, []);

    const handleImport = async () => {
        // Validate permissions
        if (currentPeriod && !isPeriodEditable(currentPeriod.id)) {
            hubbi.notify('El período actual está cerrado', 'error');
            return;
        }

        const subHubId = getEffectiveSubHubId();
        if (subHubId && !canEditSubHub(subHubId)) {
            hubbi.notify('No tienes permiso para editar esta sucursal', 'error');
            return;
        }

        // Require revalidation for imports
        const confirmed = await hubbi.auth.requireRevalidation?.('Importación masiva de inventario');
        if (!confirmed) {
            hubbi.notify('Revalidación de identidad cancelada', 'warning');
            return;
        }

        setImporting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const row of parsedData) {
            try {
                // Find or create item
                const items = await hubbi.db.query(
                    `SELECT id FROM com_hubbi_inventory_items WHERE sku = ?`,
                    [row.sku],
                    { moduleId: 'com.hubbi.inventory' }
                );

                let itemId: string;

                if (items.length === 0 && mode === 'initial' && row.name) {
                    // Create new item
                    itemId = crypto.randomUUID();
                    await hubbi.db.execute(`
            INSERT INTO com_hubbi_inventory_items (id, sku, name, weighted_average_cost, is_active)
            VALUES (?, ?, ?, ?, TRUE)
          `, [itemId, row.sku, row.name, row.cost || 0], { moduleId: 'com.hubbi.inventory' });
                } else if (items.length > 0) {
                    itemId = (items[0] as { id: string }).id;
                } else {
                    row.error = 'Producto no encontrado';
                    errorCount++;
                    continue;
                }

                // Handle stock based on mode
                if (mode === 'initial') {
                    // Set initial stock
                    await hubbi.db.execute(`
            INSERT INTO com_hubbi_inventory_stock (item_id, location_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(item_id, location_id) DO UPDATE SET quantity = ?
          `, [itemId, locationId, row.quantity, row.quantity], { moduleId: 'com.hubbi.inventory' });
                } else if (mode === 'adjust') {
                    // Add adjustment movement
                    const movementId = crypto.randomUUID();
                    await hubbi.db.execute(`
            INSERT INTO com_hubbi_inventory_movements 
              (id, item_id, location_id, type, reason, quantity, created_by, period_id)
            VALUES (?, ?, ?, 'ADJUST', 'excel_import', ?, ?, ?)
          `, [movementId, itemId, locationId, row.quantity, hubbi.getContext()?.userId, currentPeriod?.id], { moduleId: 'com.hubbi.inventory' });

                    await hubbi.db.execute(`
            INSERT INTO com_hubbi_inventory_stock (item_id, location_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(item_id, location_id) DO UPDATE SET quantity = quantity + ?
          `, [itemId, locationId, row.quantity, row.quantity], { moduleId: 'com.hubbi.inventory' });
                } else if (mode === 'sync') {
                    // Replace stock
                    await hubbi.db.execute(`
            INSERT INTO com_hubbi_inventory_stock (item_id, location_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(item_id, location_id) DO UPDATE SET quantity = ?
          `, [itemId, locationId, row.quantity, row.quantity], { moduleId: 'com.hubbi.inventory' });
                }

                successCount++;
            } catch {
                row.error = 'Error al procesar';
                errorCount++;
            }
        }

        setResult({ success: successCount, errors: errorCount });
        setStep('result');
        setImporting(false);

        if (successCount > 0) {
            onSuccess?.(successCount);
        }
    };

    const downloadTemplate = () => {
        const template = 'SKU,Nombre,Cantidad,Costo\nPROD-001,Producto Ejemplo,100,25.50\n';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_inventario.csv';
        a.click();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="text-green-600" size={20} />
                        Importar desde Excel
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    {step === 'upload' && (
                        <div className="space-y-5">
                            {/* Mode selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Modo de importación</label>
                                <div className="space-y-2">
                                    {IMPORT_MODES.map(m => (
                                        <label key={m.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${mode === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="mode"
                                                value={m.value}
                                                checked={mode === m.value}
                                                onChange={() => setMode(m.value)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-medium">{m.label}</div>
                                                <div className="text-sm text-gray-500">{m.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega destino</label>
                                <select
                                    value={locationId}
                                    onChange={(e) => setLocationId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* File upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors">
                                    <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-600 mb-2">Arrastra tu archivo Excel o CSV aquí</p>
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="excel-input"
                                    />
                                    <label htmlFor="excel-input" className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700">
                                        Seleccionar archivo
                                    </label>
                                </div>
                            </div>

                            {/* Template download */}
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
                            >
                                <Download size={16} />
                                Descargar plantilla de ejemplo
                            </button>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {parsedData.length} productos encontrados en {file?.name}
                                </p>
                                <button onClick={() => setStep('upload')} className="text-sm text-blue-600 hover:underline">
                                    Cambiar archivo
                                </button>
                            </div>

                            <div className="border rounded-lg overflow-hidden max-h-64 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left">SKU</th>
                                            <th className="px-3 py-2 text-left">Nombre</th>
                                            <th className="px-3 py-2 text-right">Cantidad</th>
                                            <th className="px-3 py-2 text-right">Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.slice(0, 50).map((row, i) => (
                                            <tr key={i} className={row.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                                <td className="px-3 py-2 font-mono">{row.sku}</td>
                                                <td className="px-3 py-2">{row.name || '-'}</td>
                                                <td className="px-3 py-2 text-right">{row.quantity}</td>
                                                <td className="px-3 py-2 text-right">{row.cost ?? '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {parsedData.length > 50 && (
                                <p className="text-sm text-gray-500 text-center">
                                    Mostrando 50 de {parsedData.length} productos
                                </p>
                            )}
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="text-center py-8">
                            {result.errors === 0 ? (
                                <Check size={48} className="mx-auto text-green-600 mb-4" />
                            ) : (
                                <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                            )}
                            <h3 className="text-xl font-semibold mb-2">Importación completada</h3>
                            <p className="text-gray-600">
                                {result.success} productos importados exitosamente
                                {result.errors > 0 && `, ${result.errors} errores`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
                        {step === 'result' ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {step === 'preview' && (
                        <button
                            onClick={handleImport}
                            disabled={importing || parsedData.length === 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Upload size={16} />
                            {importing ? 'Importando...' : `Importar ${parsedData.length} productos`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
