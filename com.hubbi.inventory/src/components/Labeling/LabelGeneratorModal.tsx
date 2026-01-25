
import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Search, X, Minus, Plus } from 'lucide-react';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';
import { LabelPreview } from './LabelPreview';
import { InventoryItem } from '../../types/inventory';

interface Props {
    open: boolean;
    onClose: () => void;
    // In a real scenario, we might pass a pre-selected item
    initialItem?: InventoryItem;
}

export const LabelGeneratorModal: React.FC<Props> = ({ open, onClose, initialItem }) => {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(initialItem || null);
    const [quantity, setQuantity] = useState(1);
    const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [searchTerm, setSearchTerm] = useState('');

    // Print logic
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: selectedItem ? `Labels_${selectedItem.sku}` : 'Labels',
        onAfterPrint: () => console.log("Printed"),
    });

    if (!open) return null;

    // Mock search function
    const handleSearch = async () => {
        if (!searchTerm) return;
        try {
            const results = await window.hubbi.db.query<InventoryItem>(
                "SELECT * FROM items WHERE name LIKE ? OR sku LIKE ? LIMIT 1",
                [`%${searchTerm}%`, `%${searchTerm}%`],
                { moduleId: 'com.hubbi.inventory' }
            );
            if (results.length > 0) {
                setSelectedItem(results[0]);
            } else {
                window.hubbi.notify("No se encontró ningún producto", "warning");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Printer size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Generador de Etiquetas</h2>
                            <p className="text-sm text-gray-500">Impresión térmica para productos y activos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Left Panel: Configuration */}
                    <div className="w-full md:w-1/3 p-6 border-r border-gray-200 dark:border-gray-800 space-y-6 overflow-y-auto">

                        {/* Search */}
                        {!selectedItem ? (
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Buscar Producto</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nombre o SKU..."
                                        value={searchTerm}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        onChange={(e: any) => setSearchTerm(e.target.value)}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} className="px-3">
                                        <Search size={18} />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50 relative">
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-2 right-2 p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full text-purple-700"
                                >
                                    <X size={14} />
                                </button>
                                <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100">{selectedItem.name}</h4>
                                <p className="text-xs font-mono text-purple-700 dark:text-purple-300 mt-1">{selectedItem.sku}</p>
                            </div>
                        )}

                        {/* Settings */}
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Tamaño de Etiqueta</label>
                                <Select
                                    value={labelSize}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onChange={(val) => setLabelSize(val as any)}
                                    options={[
                                        { value: 'small', label: 'Pequeña (32mm - Joyería)' },
                                        { value: 'medium', label: 'Estándar (50x25mm)' },
                                        { value: 'large', label: 'Grande (Shipping / Caja)' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Cantidad</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-800"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-2xl font-black tabular-nums w-12 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-800"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Panel: Preview */}
                    <div className="flex-1 bg-gray-50 dark:bg-black/50 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <div className="bg-white dark:bg-neutral-800 px-3 py-1 rounded-full text-xs font-mono border shadow-sm">
                                {labelSize}
                            </div>
                        </div>

                        {selectedItem ? (
                            <div className="space-y-8 w-full flex flex-col items-center">
                                {/* The Printable Area */}
                                <div className="border-2 border-dashed border-gray-300 p-8 rounded-xl bg-white/50 backdrop-blur-sm">
                                    <LabelPreview
                                        sku={selectedItem.sku || 'NO-SKU'}
                                        name={selectedItem.name}
                                        price={selectedItem.price_base}
                                        size={labelSize}
                                    />
                                </div>

                                <p className="text-sm text-gray-500 italic">
                                    Vista previa de 1 etiqueta. Se imprimirán {quantity}.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400">
                                <Search size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Selecciona un producto para ver la vista previa</p>
                            </div>
                        )}

                        {/* Hidden Printable Content */}
                        <div style={{ display: 'none' }}>
                            <div ref={componentRef} className="print-container">
                                <style>{`
                                    @media print {
                                        @page { margin: 0; }
                                        body { margin: 0; }
                                        .print-page-break { page-break-after: always; }
                                    }
                                `}</style>
                                {selectedItem && Array.from({ length: quantity }).map((_, i) => (
                                    <div key={i} className="print-page-break flex items-center justify-center h-full w-full">
                                        <LabelPreview
                                            sku={selectedItem.sku || 'NO-SKU'}
                                            name={selectedItem.name}
                                            price={selectedItem.price_base}
                                            size={labelSize}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-neutral-900/50">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handlePrint} disabled={!selectedItem} className="px-8">
                        <Printer size={18} className="mr-2" />
                        Imprimir {quantity} Etiquetas
                    </Button>
                </div>

            </div>
        </div>
    );
};
