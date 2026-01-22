import { useState } from 'react';
import { X, Package, Check, AlertCircle, Info, DollarSign, List, Monitor } from 'lucide-react';
import { useInventoryStore } from '../../../context/InventoryContext';

const FlagBadge = ({ label, value }: { label: string; value: boolean }) => {
    if (!value) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            <Check className="w-3 h-3" /> {label}
        </span>
    );
};

type TabId = 'overview' | 'details' | 'financial' | 'specs';

export default function SidebarPreview() {
    const { selectedItem, selectItem } = useInventoryStore();
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    if (!selectedItem) return null;

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Resumen', icon: <Info className="w-4 h-4" /> },
        { id: 'details', label: 'Detalles', icon: <List className="w-4 h-4" /> },
        { id: 'financial', label: '$$', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'specs', label: 'Specs', icon: <Monitor className="w-4 h-4" /> },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-hubbi-border flex items-center justify-between px-4 bg-hubbi-card">
                <span className="font-semibold text-hubbi-text">Detalles</span>
                <button
                    onClick={() => selectItem(null)}
                    className="p-1 hover:bg-hubbi-muted rounded-md text-hubbi-dim hover:text-hubbi-text"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Hero Section (Always Visible) */}
            <div className="p-6 pb-2 border-b border-hubbi-border">
                <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 bg-hubbi-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-hubbi-border">
                        {selectedItem.photo_url ? (
                            <img src={selectedItem.photo_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="w-8 h-8 text-hubbi-dim" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-hubbi-text leading-tight truncate" title={selectedItem.name}>
                            {selectedItem.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs bg-hubbi-muted px-1.5 py-0.5 rounded text-hubbi-dim">
                                {selectedItem.sku || 'N/A'}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${selectedItem.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {selectedItem.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-hubbi-border px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                                ? 'border-hubbi-primary text-hubbi-primary'
                                : 'border-transparent text-hubbi-dim hover:text-hubbi-text'
                            }
                `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-wider mb-3">Resumen Operativo</h3>
                            <div className="flex flex-wrap gap-2">
                                <FlagBadge label="Vendible" value={selectedItem.is_saleable} />
                                <FlagBadge label="Comprable" value={selectedItem.is_purchasable} />
                                <FlagBadge label="Garantía" value={selectedItem.has_warranty} />
                                <FlagBadge label="Vence" value={selectedItem.has_expiration} />
                                <FlagBadge label="Exento IVA" value={selectedItem.is_tax_exempt} />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-wider mb-3">Descripción</h3>
                            <p className="text-sm text-hubbi-text leading-relaxed">
                                {selectedItem.description || 'Sin descripción disponible.'}
                            </p>
                        </section>
                    </div>
                )}

                {/* TAB: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-3 bg-hubbi-muted/50 rounded-lg">
                                <label className="text-xs text-hubbi-dim block mb-1">Tipo de Ítem</label>
                                <div className="text-sm font-medium capitalize flex items-center gap-2 text-hubbi-text">
                                    {selectedItem.type}
                                </div>
                            </div>
                            <div className="p-3 bg-hubbi-muted/50 rounded-lg">
                                <label className="text-xs text-hubbi-dim block mb-1">Categoría</label>
                                <div className="text-sm font-medium capitalize text-hubbi-text">{selectedItem.category_id}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-hubbi-muted/50 rounded-lg">
                                    <label className="text-xs text-hubbi-dim block mb-1">Unidad Base</label>
                                    <div className="text-sm font-medium text-hubbi-text">{selectedItem.base_unit_id}</div>
                                </div>
                                <div className="p-3 bg-hubbi-muted/50 rounded-lg">
                                    <label className="text-xs text-hubbi-dim block mb-1">Unidad Compra</label>
                                    <div className="text-sm font-medium text-hubbi-text">{selectedItem.purchase_unit_id || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: FINANCIAL */}
                {activeTab === 'financial' && (
                    <div className="space-y-4">
                        <div className="bg-hubbi-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-hubbi-dim">Precio Base</span>
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">${selectedItem.price_base.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-hubbi-border pt-2 flex justify-between items-center">
                                <span className="text-sm text-hubbi-dim">Costo Promedio</span>
                                <span className="text-sm font-mono text-hubbi-text">${selectedItem.cost_avg.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Future: Multi-UOM Prices Table */}
                        <div className="text-xs text-hubbi-dim text-center italic mt-8">
                            Gestión de precios por unidad disponible próximamente
                        </div>
                    </div>
                )}

                {/* TAB: SPECS (Attributes + Assets) */}
                {activeTab === 'specs' && (
                    <div className="space-y-6">
                        {selectedItem.attributes && Object.keys(selectedItem.attributes).length > 0 ? (
                            <section>
                                <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-wider mb-3">Atributos Dinámicos</h3>
                                <div className="bg-hubbi-muted/50 rounded-lg divide-y divide-hubbi-border">
                                    {Object.entries(selectedItem.attributes).map(([key, value]) => (
                                        <div key={key} className="p-3 flex justify-between">
                                            <span className="text-sm text-hubbi-dim capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-sm font-medium text-hubbi-text">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <p className="text-sm text-hubbi-dim italic">No hay atributos definidos.</p>
                        )}

                        {selectedItem.type === 'asset' && selectedItem.asset_meta && (
                            <section>
                                <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-wider mb-3">Datos de Activo Fijo</h3>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                        <div className="text-xs text-amber-800 dark:text-amber-200">
                                            <p><strong>Método Depreciación:</strong> {selectedItem.asset_meta.depreciation_method}</p>
                                            <p><strong>Vida Útil:</strong> {selectedItem.asset_meta.useful_life_years} años</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
