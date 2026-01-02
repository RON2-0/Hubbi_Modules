import { useState, useEffect, useMemo } from 'react';
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
import { Search, Filter, Plus, Edit, Trash2, Box, Package, Truck, Activity, ArrowUpDown } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { hubbi } from '../hubbi-sdk.d';

const columnHelper = createColumnHelper<InventoryItem>();

export const ProductsTable = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const fetchItems = async () => {
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
    };

    useEffect(() => {
        fetchItems();

        const handleUpdate = () => fetchItems();

        hubbi.events.on('inventory:item:created', handleUpdate);
        hubbi.events.on('inventory:item:updated', handleUpdate);

        return () => {
            hubbi.events.off('inventory:item:created', handleUpdate);
            hubbi.events.off('inventory:item:updated', handleUpdate);
        };
    }, []);

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
                    <span className="font-medium text-gray-900">{info.getValue()}</span>
                    {info.row.original.description && (
                        <span className="text-xs text-gray-400 truncate max-w-xs">
                            {info.row.original.description}
                        </span>
                    )}
                </div>
            )
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: info => <span className="font-mono text-gray-600">{info.getValue()}</span>
        }),
        columnHelper.accessor('type', {
            header: 'Tipo',
            cell: info => (
                <div className="flex items-center gap-2" title={info.getValue()}>
                    {getTypeIcon(info.getValue())}
                    <span className="text-sm capitalize text-gray-600">{info.getValue()}</span>
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
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-600">
                        <Edit size={16} />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600">
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
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por SKU o Nombre..."
                            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer text-gray-600 font-medium"
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
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={18} />
                    Nuevo Producto
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={header.column.getToggleSortingHandler()}>
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <ArrowUpDown size={12} className="text-gray-400" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-gray-400">Cargando inventario...</td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-12 text-gray-400">No se encontraron productos</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
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
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border rounded text-xs disabled:opacity-50"
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
