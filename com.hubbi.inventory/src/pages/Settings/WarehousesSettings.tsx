import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel
} from '@tanstack/react-table';
import { Warehouse, Plus, Search, Trash2, Edit2, Building2 } from 'lucide-react';
import { InventoryWarehouse } from '../../types/inventory';
import WarehouseForm from './WarehouseForm';
import { clsx } from 'clsx';

// Core UI Components
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

const columnHelper = createColumnHelper<InventoryWarehouse>();

export default function WarehousesSettings() {
    const [warehouses, setWarehouses] = useState<InventoryWarehouse[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<InventoryWarehouse | null>(null);

    // Filters & Sorting State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const context = window.hubbi.getContext();
    const hasBranchPermission = window.hubbi.hasPermission('subhub.select');
    const [selectedBranchId, setSelectedBranchId] = useState<string>(String(context?.subHubId || ''));

    const fetchWarehouses = useCallback(async () => {
        try {
            setLoading(true);
            let sql = "SELECT * FROM warehouses WHERE 1=1 ";
            const params = [];

            if (selectedBranchId && selectedBranchId !== 'all') {
                sql += " AND sub_hub_id = ?";
                params.push(selectedBranchId);
            }

            const results = await window.hubbi.db.query<InventoryWarehouse>(sql, params, { moduleId: 'com.hubbi.inventory' });

            // Fetch Branch Names for Column Display
            const allBranches = await window.hubbi.subHubs.list();
            setBranches(allBranches);

            setWarehouses(results);
        } catch (err) {
            console.error("Error fetching warehouses", err);
            window.hubbi.notify("Error al cargar bodegas", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedBranchId]);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta bodega?")) return;
        try {
            await window.hubbi.db.delete('warehouses', id, { moduleId: 'com.hubbi.inventory' });
            window.hubbi.notify("Bodega eliminada", "success");
            fetchWarehouses();
        } catch (err) {
            console.error("Error deleting warehouse", err);
            window.hubbi.notify("Error al eliminar bodega", "error");
        }
    };

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: () => <div className="flex items-center gap-2">Nombre de Bodega</div>,
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-hubbi-primary/5 rounded-lg">
                        <Warehouse className="w-4 h-4 text-hubbi-primary" />
                    </div>
                    <span className="font-bold text-hubbi-text">{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('sub_hub_id', {
            header: 'Sucursal',
            cell: info => {
                const branch = branches.find(b => String(b.id) === String(info.getValue()));
                return (
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-hubbi-dim" />
                        <span className="text-sm text-hubbi-dim truncate max-w-[150px]">{branch?.name || 'Local'}</span>
                    </div>
                );
            }
        }),
        columnHelper.accessor('is_active', {
            header: () => <div className="text-center">Estado</div>,
            cell: info => (
                <div className="flex justify-center">
                    <span className={clsx(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        info.getValue() !== false
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}>
                        {info.getValue() !== false ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
            )
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-right px-2">Acciones</div>,
            cell: info => (
                <div className="flex justify-end gap-1 px-2">
                    <button
                        onClick={() => {
                            setEditingWarehouse(info.row.original);
                            setIsFormOpen(true);
                        }}
                        className="p-2 text-hubbi-dim hover:text-hubbi-primary hover:bg-hubbi-primary/10 rounded-lg transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => handleDelete(info.row.original.id)}
                        className="p-2 text-hubbi-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        })
    ], [branches]);

    const table = useReactTable({
        data: warehouses,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="p-6 space-y-6 flex flex-col h-full animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-hubbi-text tracking-tight flex items-center gap-3">
                        Gestión de Bodegas
                        {loading && <div className="w-4 h-4 border-2 border-hubbi-primary border-t-transparent rounded-full animate-spin" />}
                    </h2>
                    <p className="text-sm text-hubbi-dim mt-1">
                        Control centralizado de puntos de almacenamiento por sucursal.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingWarehouse(null);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    Nueva Bodega
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar por nombre o ID de bodega..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        startIcon={<Search size={16} className="text-hubbi-dim" />}
                    />
                </div>

                <div className="flex items-center gap-2 min-w-[200px]">
                    {hasBranchPermission ? (
                        <Select
                            value={selectedBranchId}
                            onChange={(val) => setSelectedBranchId(val as string)}
                            options={[
                                { value: 'all', label: 'Todas las Sucursales' },
                                ...branches.map(b => ({ value: String(b.id), label: b.name }))
                            ]}
                        />
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-hubbi-muted/30 rounded-xl border border-hubbi-border flex-1">
                            <Building2 size={14} className="text-hubbi-primary" />
                            <span className="text-sm font-bold text-hubbi-text">{context?.subHubName || 'Local'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 min-h-0 bg-hubbi-card border border-hubbi-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-auto flex-1 no-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-hubbi-muted/30 sticky top-0 z-10">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-hubbi-dim border-b border-hubbi-border cursor-pointer hover:text-hubbi-primary transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: ' ↑',
                                                    desc: ' ↓',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-hubbi-border">
                            {table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="group hover:bg-hubbi-primary/5 transition-all duration-200"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && warehouses.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Warehouse size={48} />
                                            <p className="font-bold">No se encontraron bodegas</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t border-hubbi-border bg-hubbi-muted/10 flex items-center justify-between">
                    <span className="text-xs text-hubbi-dim font-medium">
                        {loading ? 'Sincronizando...' : `${warehouses.length} bodegas vinculadas`}
                    </span>
                </div>
            </div>

            {/* MODALS */}
            <WarehouseForm
                open={isFormOpen}
                initialData={editingWarehouse}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchWarehouses}
            />
        </div>
    );
}
