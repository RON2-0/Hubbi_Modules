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
} from '@tanstack/react-table';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, FileText, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryMovement, InventoryItem } from '../types/inventory';

interface MovementsHistoryProps {
    item?: InventoryItem;
}

const columnHelper = createColumnHelper<InventoryMovement>();

export const MovementsHistory = ({ item }: MovementsHistoryProps) => {
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        let sql = `SELECT * FROM com_hubbi_inventory_movements ORDER BY created_at DESC LIMIT 500`;
        let params: unknown[] = [];

        if (item) {
            sql = `SELECT * FROM com_hubbi_inventory_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT 500`;
            params = [item.id];
        }

        const data = await hubbi.data.query(sql, params);
        if (data && Array.isArray(data)) setMovements(data);
        setLoading(false);
    }, [item]);

    useEffect(() => {
        fetchMovements();

        const handleUpdate = () => fetchMovements();

        // Listen for any stock change as that implies a movement
        hubbi.events.on('inventory:stock:increased', handleUpdate);
        hubbi.events.on('inventory:stock:decreased', handleUpdate);

        return () => {
            hubbi.events.off('inventory:stock:increased', handleUpdate);
            hubbi.events.off('inventory:stock:increased', handleUpdate);
            hubbi.events.off('inventory:stock:decreased', handleUpdate);
        };
    }, [item, fetchMovements]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'IN': return <ArrowDownLeft className="text-green-600" size={16} />;
            case 'OUT': return <ArrowUpRight className="text-red-600" size={16} />;
            case 'ADJUST': return <FileText className="text-hubbi-dim" size={16} />;
            default: return <ArrowRightLeft className="text-blue-600" size={16} />;
        }
    };

    const columns = useMemo(() => [
        columnHelper.accessor('type', {
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting()} className="flex items-center gap-1">
                    Tipo <ArrowUpDown size={14} />
                </button>
            ),
            cell: info => (
                <div className="flex items-center gap-2">
                    {getIcon(info.getValue())}
                    <span className="font-medium">{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting()} className="flex items-center gap-1">
                    Fecha <ArrowUpDown size={14} />
                </button>
            ),
            cell: info => new Date(info.getValue()).toLocaleString(),
        }),
        columnHelper.accessor('reason', {
            header: 'Motivo',
            cell: info => (
                <div className="max-w-xs truncate" title={info.getValue() || ''}>
                    {info.getValue() || '-'}
                </div>
            ),
        }),
        columnHelper.accessor('quantity', {
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 ml-auto">
                    Cantidad <ArrowUpDown size={14} />
                </button>
            ),
            cell: info => {
                const row = info.row.original;
                const isOut = row.type === 'OUT';
                return (
                    <span className={`font-mono font-medium ${isOut ? 'text-red-600' : 'text-green-600'}`}>
                        {isOut ? '-' : '+'}{info.getValue()}
                    </span>
                );
            },
        }),
        columnHelper.accessor('cost_at_moment', {
            header: 'Costo Unit.',
            cell: info => <span className="font-mono">${info.getValue().toFixed(2)}</span>,
        }),
        columnHelper.accessor('total_value', {
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting()} className="flex items-center gap-1 ml-auto">
                    Total <ArrowUpDown size={14} />
                </button>
            ),
            cell: info => <span className="font-mono font-medium">${info.getValue().toFixed(2)}</span>,
        }),
    ], []);

    const table = useReactTable({
        data: movements,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 20 } },
    });

    return (
        <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-hubbi-border flex items-center justify-between">
                <h3 className="font-semibold text-hubbi-text flex items-center gap-2">
                    <Clock size={16} />
                    Historial de Movimientos
                </h3>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text focus:outline-none focus:ring-2 focus:ring-hubbi-primary"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-hubbi-bg text-hubbi-dim">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-4 py-2 font-medium">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-hubbi-border">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-hubbi-dim">Cargando...</td></tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-hubbi-dim">No hay movimientos registrados</td></tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-hubbi-bg/50">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-4 py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-hubbi-border flex items-center justify-between text-sm text-hubbi-dim">
                <span>
                    Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, movements.length)} de {movements.length}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="p-1 rounded hover:bg-hubbi-bg disabled:opacity-50"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span>Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="p-1 rounded hover:bg-hubbi-bg disabled:opacity-50"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
