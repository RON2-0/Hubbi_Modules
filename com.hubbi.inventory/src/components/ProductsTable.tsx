import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
    ColumnFiltersState
} from '@tanstack/react-table';
import { Search, Filter, Plus, Edit, Trash2, Box, Package, Truck, Activity, ArrowUpDown, Upload } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { hubbi } from '../hubbi-sdk.d';
import { ExcelImport } from './ExcelImport';

const columnHelper = createColumnHelper<InventoryItem>();

export const ProductsTable = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [showImport, setShowImport] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await hubbi.data.list({
            table: 'com_hubbi_inventory_items',
            options: { strategy: 'cache_first' }
        });

        if (data) {
            setItems(data as InventoryItem[]);
        } else if (error) {
            console.error(error);
            hubbi.notify.error('Error al cargar inventario');
        }
        setLoading(false);
    }, []);

    const handleUpdate = useCallback(() => fetchItems(), [fetchItems]);

    useEffect(() => {
        fetchItems();

        hubbi.events.on('inventory:item:created', handleUpdate);
        hubbi.events.on('inventory:item:updated', handleUpdate);

        return () => {
            hubbi.events.off('inventory:item:created', handleUpdate);
            hubbi.events.off('inventory:item:updated', handleUpdate);
        };
    }, [fetchItems, handleUpdate]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'kit': return <Package size={18} className="text-blue-500" />;
            case 'serialized': return <Activity size={18} className="text-purple-500" />;
            case 'asset': return <Truck size={18} className="text-orange-500" />;
            default: return <Box size={18} className="text-gray-500" />;
        }
    };

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Producto',
            cell: info => (
                <div className="flex flex-col">
                    <span className="font-medium text-hubbi-text">{info.getValue()}</span>
                    {info.row.original.description && (
                        <span className="text-xs text-hubbi-dim truncate max-w-xs">
                            {info.row.original.description}
                        </span>
                    )}
                </div>
            )
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: info => <span className="font-mono text-hubbi-dim">{info.getValue()}</span>
        }),
        columnHelper.accessor('type', {
            header: 'Tipo',
            cell: info => (
                <div className="flex items-center gap-2" title={info.getValue()}>
                    {getTypeIcon(info.getValue())}
                    <span className="text-sm capitalize text-hubbi-dim">{info.getValue()}</span>
                </div>
            )
        }),
        columnHelper.accessor('weighted_average_cost', {
            header: () => <div className="text-right">Costo Prom.</div>,
            cell: info => <div className="text-right font-mono">${info.getValue().toFixed(2)}</div>
        }),
        columnHelper.accessor('is_active', {
            header: () => <div className="text-center">Estado</div>,
            cell: info => (
                <div className="text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {info.getValue() ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            )
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-right">Acciones</div>,
            cell: () => (
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-hubbi-bg rounded text-hubbi-dim hover:text-hubbi-primary">
                        <Edit size={16} />
                    </button>
                    <button className="p-1 hover:bg-hubbi-bg rounded text-hubbi-dim hover:text-hubbi-danger">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        })
    ], []);

    const table = useReactTable({
        data: items,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="flex flex-col h-full bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-hubbi-border">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hubbi-dim" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por SKU o Nombre..."
                            className="pl-10 pr-4 py-2 border border-hubbi-border rounded-lg text-sm w-64 bg-hubbi-input text-hubbi-text focus:outline-none focus:ring-2 focus:ring-hubbi-primary/20 focus:border-hubbi-primary"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <Filter size={18} className="text-hubbi-dim" />
                        <select
                            className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-hubbi-text font-medium"
                            onChange={(e) => {
                                const val = e.target.value;
                                table.getColumn('type')?.setFilterValue(val === 'all' ? undefined : val);
                            }}
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="simple">Simples</option>
                            <option value="kit">Kits</option>
                            <option value="serialized">Serializados</option>
                            <option value="asset">Activos (Camiones)</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            // Dispatch event to open import modal from parent if needed, 
                            // or ideally ProductsTable should accept an onImport prop.
                            // For now, we'll assume the Dashboard handles global import via a mechanism, 
                            // OR we can expose the ExcelImport here too.
                            // Let's check permissions or just use a state in ProductsTable if acceptable.
                            // Actually, simpler: define showImport state in ProductsTable too.
                            setShowImport(true);
                        }}
                        className="flex items-center gap-2 bg-hubbi-card border border-hubbi-border hover:bg-hubbi-bg text-hubbi-text px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Upload size={18} />
                        Importar
                    </button>
                    <button className="flex items-center gap-2 bg-hubbi-primary hover:opacity-90 text-hubbi-primary-fg px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={18} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {showImport && (
                <ExcelImport
                    onClose={() => setShowImport(false)}
                    onSuccess={handleUpdate}
                />
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-hubbi-bg sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-6 py-3 text-xs font-semibold text-hubbi-dim uppercase tracking-wider cursor-pointer hover:bg-hubbi-card transition-colors" onClick={header.column.getToggleSortingHandler()}>
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <ArrowUpDown size={12} className="text-hubbi-dim" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-hubbi-border">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-hubbi-dim">Cargando inventario...</td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-hubbi-dim">No se encontraron productos</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-hubbi-bg/50 transition-colors group">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-3 text-sm">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-hubbi-border">
                    <div className="text-xs text-hubbi-dim">
                        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border border-hubbi-border rounded text-xs text-hubbi-text disabled:opacity-50 hover:bg-hubbi-bg"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Anterior
                        </button>
                        <button
                            className="px-3 py-1 border rounded text-xs disabled:opacity-50"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
