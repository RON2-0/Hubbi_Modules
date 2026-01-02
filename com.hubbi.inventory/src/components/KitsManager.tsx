import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Search } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';

interface KitsManagerProps {
    parentItem: InventoryItem;
    onClose: () => void;
}

interface KitComponent {
    child_item_id: string;
    child_sku: string;
    child_name: string;
    quantity: number;
}

export const KitsManager = ({ parentItem, onClose }: KitsManagerProps) => {
    const [components, setComponents] = useState<KitComponent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
    const [_loading, _setLoading] = useState(false);

    // Initial Load of existing kit components
    useEffect(() => {
        const loadComponents = async () => {
            // In a real scenario, this would be a join query
            // SELECT k.*, i.sku, i.name FROM com_hubbi_inventory_kits k JOIN ...
            const data = await hubbi.data.query(
                `SELECT k.child_item_id, k.quantity, i.sku as child_sku, i.name as child_name
                  FROM com_hubbi_inventory_kits k
                  JOIN com_hubbi_inventory_items i ON k.child_item_id = i.id
                  WHERE k.parent_item_id = ?`,
                [parentItem.id]
            );
            if (data && Array.isArray(data)) setComponents(data);
        };
        loadComponents();
    }, [parentItem.id]);

    // Search for items to add
    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
            return;
        }

        const delaySearch = setTimeout(async () => {
            const { data } = await hubbi.data.list({
                table: 'com_hubbi_inventory_items',
                query: { filter: searchTerm } // Pseudo-query for client-side matching simulation
            });

            // Client side filter to simulate API
            if (data) {
                const results = (data as InventoryItem[]).filter(i =>
                    i.id !== parentItem.id && // Can't contain itself
                    i.type !== 'kit' &&       // No nested kits for simplicity in v1
                    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                setSearchResults(results.slice(0, 5));
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchTerm, parentItem.id]);

    const addComponent = async (item: InventoryItem) => {
        const newComponent: KitComponent = {
            child_item_id: item.id,
            child_sku: item.sku,
            child_name: item.name,
            quantity: 1
        };

        // UI Optimistic Update
        setComponents([...components, newComponent]);
        setSearchTerm(''); // Clear search
        setSearchResults([]);

        // Persist
        await hubbi.data.create({
            table: 'com_hubbi_inventory_kits',
            data: {
                parent_item_id: parentItem.id,
                child_item_id: item.id,
                quantity: 1
            },
            options: { strategy: 'online_first' }
        });
    };

    const updateQuantity = async (childId: string, newQty: number) => {
        if (newQty <= 0) return;

        setComponents(components.map(c =>
            c.child_item_id === childId ? { ...c, quantity: newQty } : c
        ));

        // Debounce actual update in production, direct update here for clarity
        await hubbi.data.execute(
            `UPDATE com_hubbi_inventory_kits SET quantity = ? WHERE parent_item_id = ? AND child_item_id = ?`,
            [newQty, parentItem.id, childId]
        );
    };

    const removeComponent = async (childId: string) => {
        setComponents(components.filter(c => c.child_item_id !== childId));

        await hubbi.data.execute(
            `DELETE FROM com_hubbi_inventory_kits WHERE parent_item_id = ? AND child_item_id = ?`,
            [parentItem.id, childId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 text-blue-600 mb-1">
                        <Package size={24} />
                        <h3 className="text-xl font-bold text-gray-900">Configurar Kit</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        Definiendo contenido para: <span className="font-semibold text-gray-800">{parentItem.name}</span>
                    </p>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Agregar Componente</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Buscar ítem..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {/* Dropdown Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-20">
                                {searchResults.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addComponent(item)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                                        </div>
                                        <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {components.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Package size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Este kit está vacío.</p>
                            <p className="text-xs">Agrega productos usando el buscador superior.</p>
                        </div>
                    ) : (
                        components.map(comp => (
                            <div key={comp.child_item_id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">{comp.child_name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{comp.child_sku}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border rounded-md">
                                        <input
                                            type="number"
                                            className="w-16 text-center text-sm py-1 border-none focus:ring-0"
                                            value={comp.quantity}
                                            onChange={(e) => updateQuantity(comp.child_item_id, parseInt(e.target.value) || 0)}
                                            min="1"
                                        />
                                        <span className="text-xs text-gray-400 pr-2">unds</span>
                                    </div>
                                    <button
                                        onClick={() => removeComponent(comp.child_item_id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Terminar
                    </button>
                </div>
            </div>
        </div>
    );
};
