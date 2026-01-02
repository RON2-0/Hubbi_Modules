/**
 * Quick Adjust Component
 * 
 * Search for a product and quickly adjust its quantity (+/-).
 * Perfect for fast corrections without complex forms.
 */

import { useState, useCallback } from 'react';
import { Search, Plus, Minus, Save, X, Package, AlertTriangle } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';
import { useFiscalPeriods } from '../hooks/useFiscalPeriods';
import { useSubHubFilter } from '../hooks/useSubHubFilter';

interface QuickAdjustProps {
    onClose: () => void;
    onSuccess?: () => void;
}

interface StockInfo {
    locationId: string;
    locationName: string;
    currentStock: number;
}

const ADJUST_REASONS = [
    { value: 'correction', label: 'Corrección de inventario' },
    { value: 'damage', label: 'Producto dañado' },
    { value: 'expired', label: 'Producto vencido' },
    { value: 'internal_use', label: 'Uso interno' },
    { value: 'found', label: 'Producto encontrado' },
    { value: 'other', label: 'Otro' },
];

export const QuickAdjust = ({ onClose, onSuccess }: QuickAdjustProps) => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<InventoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState<string>('correction');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { currentPeriod, isPeriodEditable } = useFiscalPeriods();
    const { canEditSubHub, getEffectiveSubHubId } = useSubHubFilter();

    const handleSearch = useCallback(async () => {
        if (!search.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const data = await hubbi.db.query(
            `SELECT * FROM com_hubbi_inventory_items 
       WHERE (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)
       AND is_active = TRUE
       LIMIT 10`,
            [`%${search}%`, `%${search}%`, `%${search}%`],
            { moduleId: 'com.hubbi.inventory' }
        );
        setResults(data as InventoryItem[]);
        setLoading(false);
    }, [search]);

    const selectProduct = async (item: InventoryItem) => {
        setSelectedItem(item);
        setResults([]);
        setSearch(item.name);

        // Load stock by location
        const stocks = await hubbi.db.query(
            `SELECT s.location_id as locationId, l.name as locationName, s.quantity as currentStock
       FROM com_hubbi_inventory_stock s
       JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
       WHERE s.item_id = ?`,
            [item.id],
            { moduleId: 'com.hubbi.inventory' }
        );
        setStockInfo(stocks as StockInfo[]);

        if (stocks.length > 0) {
            setSelectedLocation((stocks[0] as StockInfo).locationId);
        }
    };

    const handleSave = async () => {
        if (!selectedItem || !selectedLocation || quantity <= 0) {
            hubbi.notify('Completa todos los campos', 'warning');
            return;
        }

        // Check period is editable
        if (currentPeriod && !isPeriodEditable(currentPeriod.id)) {
            hubbi.notify('El período actual está cerrado. No se puede ajustar.', 'error');
            return;
        }

        // Check sub_hub permission
        const subHubId = getEffectiveSubHubId();
        if (subHubId && !canEditSubHub(subHubId)) {
            hubbi.notify('No tienes permiso para editar esta sucursal.', 'error');
            return;
        }

        // Require revalidation for large adjustments
        if (quantity > 100) {
            const confirmed = await hubbi.auth.requireRevalidation?.('Ajuste de inventario mayor a 100 unidades');
            if (!confirmed) {
                hubbi.notify('Revalidación de identidad cancelada', 'warning');
                return;
            }
        }

        setSaving(true);

        const movementId = crypto.randomUUID();
        const signedQty = adjustType === 'add' ? quantity : -quantity;
        const movementType = adjustType === 'add' ? 'IN' : 'OUT';

        // Get current cost
        const costAtMoment = selectedItem.weighted_average_cost || 0;

        // Create adjustment movement
        await hubbi.db.execute(`
      INSERT INTO com_hubbi_inventory_movements 
        (id, item_id, location_id, type, reason, quantity, cost_at_moment, total_value, created_by, period_id, sub_hub_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            movementId,
            selectedItem.id,
            selectedLocation,
            movementType,
            reason + (notes ? `: ${notes}` : ''),
            Math.abs(signedQty),
            costAtMoment,
            Math.abs(signedQty) * costAtMoment,
            hubbi.getContext()?.userId || 'system',
            currentPeriod?.id || null,
            subHubId,
        ], { moduleId: 'com.hubbi.inventory' });

        // Update stock
        await hubbi.db.execute(`
      INSERT INTO com_hubbi_inventory_stock (item_id, location_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(item_id, location_id) DO UPDATE SET quantity = quantity + ?
    `, [selectedItem.id, selectedLocation, signedQty, signedQty], { moduleId: 'com.hubbi.inventory' });

        setSaving(false);
        hubbi.notify(`Ajuste registrado: ${adjustType === 'add' ? '+' : '-'}${quantity} ${selectedItem.name}`, 'success');
        onSuccess?.();
        onClose();
    };

    const currentStock = stockInfo.find(s => s.locationId === selectedLocation)?.currentStock || 0;
    const newStock = adjustType === 'add' ? currentStock + quantity : currentStock - quantity;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="text-indigo-600" size={20} />
                        Ajuste Rápido
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Producto</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Código, SKU o nombre..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="absolute right-2 top-1.5 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                            >
                                Buscar
                            </button>
                        </div>

                        {/* Results dropdown */}
                        {results.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                                {results.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => selectProduct(item)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-0"
                                    >
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Product Info */}
                    {selectedItem && (
                        <>
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <div className="font-medium text-indigo-900">{selectedItem.name}</div>
                                <div className="text-sm text-indigo-700">SKU: {selectedItem.sku}</div>
                            </div>

                            {/* Location selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    {stockInfo.map(s => (
                                        <option key={s.locationId} value={s.locationId}>
                                            {s.locationName} (Stock: {s.currentStock})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Adjust Type */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAdjustType('add')}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${adjustType === 'add'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Plus size={18} /> Entrada
                                </button>
                                <button
                                    onClick={() => setAdjustType('subtract')}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${adjustType === 'subtract'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Minus size={18} /> Salida
                                </button>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Razón</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    {ADJUST_REASONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Detalles adicionales..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            {/* Preview */}
                            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-gray-600">Stock resultante:</span>
                                <span className={`font-bold ${newStock < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {currentStock} → {newStock}
                                </span>
                            </div>

                            {newStock < 0 && (
                                <div className="flex items-center gap-2 text-amber-600 text-sm">
                                    <AlertTriangle size={16} />
                                    El stock resultante será negativo
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedItem || !selectedLocation || quantity <= 0 || saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {saving ? 'Guardando...' : 'Guardar Ajuste'}
                    </button>
                </div>
            </div>
        </div>
    );
};
