import React, { useState } from 'react';
import { InventoryItem, InventoryItemType } from '../types/inventory';
import { useInventoryActions } from '../hooks/useInventoryActions';
import { Save, X, Truck, Package, Activity, Info } from 'lucide-react';

interface ProductFormProps {
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: Partial<InventoryItem>;
}

export const ProductForm = ({ onClose, onSuccess, initialData }: ProductFormProps) => {
    const { createItem, loading } = useInventoryActions();

    // Form State
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        type: 'simple',
        is_active: true,
        is_internal_use_only: false,
        attributes: {},
        ...initialData
    });

    // Dynamic Attribute State
    const [attributes, setAttributes] = useState<Record<string, string | number | boolean | undefined>>(formData.attributes || {});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.sku || !formData.name) return;

        const result = await createItem({
            ...formData as Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>,
            attributes
        });

        if (result.success) {
            onSuccess?.();
            onClose();
        }
    };

    const renderDynamicFields = () => {
        switch (formData.type) {
            case 'asset': // Vehicles / Machinery
                return (
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-4">
                        <div className="col-span-2 flex items-center gap-2 text-orange-600 mb-2">
                            <Truck size={18} />
                            <span className="font-semibold text-sm">Mascarilla de Activo (Camión)</span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">VIN (Número Chasis)</label>
                            <input
                                className="w-full border rounded px-3 py-2 text-sm"
                                placeholder="1HGCM82633..."
                                value={(attributes.vin as string) || ''}
                                onChange={e => setAttributes({ ...attributes, vin: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Placa / Matrícula</label>
                            <input
                                className="w-full border rounded px-3 py-2 text-sm"
                                placeholder="C-123456"
                                value={(attributes.plate as string) || ''}
                                onChange={e => setAttributes({ ...attributes, plate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kilometraje Inicial</label>
                            <input
                                type="number"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={(attributes.mileage as string | number) || ''}
                                onChange={e => setAttributes({ ...attributes, mileage: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
                            <input
                                type="number"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={(attributes.year as string | number) || ''}
                                onChange={e => setAttributes({ ...attributes, year: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'serialized': // High value parts (Motores, ECMs)
                return (
                    <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 mt-4">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                            <Activity size={18} />
                            <span className="font-semibold text-sm">Control Serializado</span>
                        </div>
                        <div className="bg-purple-50 p-3 rounded text-xs text-purple-700">
                            <Info size={14} className="inline mr-1" />
                            Este producto requerirá escanear o ingresar un número de serie único para cada unidad que entre al inventario.
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="require_qc"
                                checked={(attributes.require_qc as boolean) || false}
                                onChange={e => setAttributes({ ...attributes, require_qc: e.target.checked })}
                            />
                            <label htmlFor="require_qc" className="text-sm text-gray-700">Requerir Control de Calidad al ingreso</label>
                        </div>
                    </div>
                );
            case 'kit': // Service Kits
                return (
                    <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 mt-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Package size={18} />
                            <span className="font-semibold text-sm">Definición de Kit</span>
                        </div>
                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                            <Info size={14} className="inline mr-1" />
                            Los componentes del kit se definirán en la pestaña "Composición" después de crear el producto.
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900">
                            {initialData?.id ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                        {/* Core Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Tipo de Producto</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['simple', 'asset', 'serialized', 'kit'] as InventoryItemType[]).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t })}
                                            className={`px-3 py-2 rounded text-sm font-medium border text-left capitalize transition-all ${formData.type === t
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">SKU (Código Único)</label>
                                    <input
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                        placeholder="FIL-ACE-001"
                                        value={formData.sku || ''}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Producto</label>
                                    <input
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Filtro de Aceite Genérico"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                            <textarea
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Dynamics */}
                        {renderDynamicFields()}

                        {/* Toggles */}
                        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Activo</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.is_internal_use_only}
                                    onChange={e => setFormData({ ...formData, is_internal_use_only: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Uso Interno Exclusivo</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : (
                                <>
                                    <Save size={18} />
                                    Guardar Producto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
