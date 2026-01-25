import { LayoutGrid, Table2, Building2, Plus } from 'lucide-react';
import { useInventoryStore } from '../../context/InventoryContext';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { InventoryWarehouse } from '../../types/inventory';
import { SchemaProductForm } from '../../components/CreateProduct/SchemaProductForm';
import { useInventoryData } from '../../hooks/useInventoryData';

// Core UI Components
import { Select } from '../../../../../Hubbi/src/components/ui/Select';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

export default function Header() {
    const {
        viewMode, setViewMode,
        selectedSubHubId, setSubHubFilter,
        selectedWarehouseId, setWarehouseFilter,
    } = useInventoryStore();

    const { refresh } = useInventoryData();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [branches, setBranches] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<InventoryWarehouse[]>([]);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);

    const context = typeof window !== 'undefined' ? window.hubbi?.getContext() : null;

    // Fetch Initial Data
    useEffect(() => {
        const load = async () => {
            if (typeof window === 'undefined') return;
            const b = await window.hubbi.subHubs.list();
            setBranches(b);
        };
        load();
    }, []);

    // Fetch Warehouses based on filters
    useEffect(() => {
        let isMounted = true;

        const loadWarehouses = async () => {
            if (typeof window === 'undefined') return;
            let sql = "SELECT * FROM warehouses WHERE 1=1";
            const params = [];

            if (selectedSubHubId) {
                sql += " AND sub_hub_id = ?";
                params.push(selectedSubHubId);
            }

            try {
                const results = await window.hubbi.db.query<InventoryWarehouse>(sql, params, { moduleId: 'com.hubbi.inventory' });
                if (isMounted) {
                    setWarehouses(results);
                }
            } catch (error) {
                console.error("Failed to load warehouses", error);
            }
        };

        loadWarehouses();

        return () => { isMounted = false; };
    }, [selectedSubHubId]);

    const viewOptions = [
        { id: 'table', label: 'Tabla', icon: Table2 },
        { id: 'vms', label: 'WMS', icon: LayoutGrid },
    ] as const;

    const hasSubHubSwitcher = window.hubbi.hasPermission('subhub.select');

    return (
        <div className="flex flex-col gap-4 p-4 border-b border-hubbi-border bg-hubbi-card animate-in slide-in-from-top-2 duration-300">

            {/* ROW 1: Centered View Switcher */}
            <div className="flex justify-center">
                <div className="flex bg-hubbi-input/50 p-1 rounded-xl border border-hubbi-border/50">
                    {viewOptions.map((option) => {
                        const isActive = viewMode === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => setViewMode(option.id)}
                                className={clsx(
                                    "px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                    isActive
                                        ? "bg-hubbi-card shadow-sm text-hubbi-primary ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-hubbi-dim hover:text-hubbi-text hover:bg-hubbi-muted/50"
                                )}
                            >
                                <option.icon className="w-3.5 h-3.5" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ROW 2: Filters + New Product Button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* BRANCH SELECTOR */}
                    {hasSubHubSwitcher ? (
                        <div className="w-full md:w-56">
                            <Select
                                icon={Building2}
                                value={selectedSubHubId ? String(selectedSubHubId) : ''}
                                onChange={(val) => setSubHubFilter(val ? String(val) : null)}
                                options={[
                                    { value: '', label: 'Todas las Sucursales' },
                                    ...branches.map(b => ({ value: String(b.id), label: b.name }))
                                ]}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-hubbi-input/20 rounded-xl border border-hubbi-border/50">
                            <Building2 className="w-3.5 h-3.5 text-hubbi-primary" />
                            <span className="text-xs font-bold text-hubbi-text">{context?.subHubName || 'Sucursal Local'}</span>
                        </div>
                    )}

                    {/* WAREHOUSE SELECTOR */}
                    <div className="w-full md:w-56">
                        <Select
                            icon={LayoutGrid}
                            value={selectedWarehouseId || ''}
                            onChange={(val) => setWarehouseFilter(val ? String(val) : null)}
                            options={[
                                { value: '', label: 'Todas las Bodegas' },
                                ...warehouses.map(w => ({ value: w.id, label: w.name }))
                            ]}
                        />
                    </div>
                </div>

                <Button
                    onClick={() => setIsProductFormOpen(true)}
                    className="w-full md:w-auto px-6 whitespace-nowrap"
                >
                    <Plus size={16} className="mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            {/* MODALS */}
            <SchemaProductForm
                open={isProductFormOpen}
                onClose={() => setIsProductFormOpen(false)}
                onSuccess={refresh}
            />
        </div>
    );
}
