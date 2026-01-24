import { useState } from 'react';
import React from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
} from '@tanstack/react-table';
import { useInventoryStore } from '../../../context/InventoryContext';
import { useInventoryData } from '../../../hooks/useInventoryData';
import { InventoryItem } from '../../../types/inventory';
import { ArrowUpDown, Search, Package, Wrench, Briefcase, Download } from 'lucide-react';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';

const columnHelper = createColumnHelper<InventoryItem>();

const TYPE_ICONS: Record<string, React.ReactNode> = {
    product: <Package className="w-4 h-4 text-blue-500" />,
    service: <Wrench className="w-4 h-4 text-orange-500" />,
    asset: <Briefcase className="w-4 h-4 text-purple-500" />,
    kit: <Package className="w-4 h-4 text-green-500" />,
};

const columns = [
    columnHelper.accessor('kind', {
        header: 'Tipo',
        cell: (info) => (
            <div className="flex justify-center" title={info.getValue()}>
                {TYPE_ICONS[info.getValue().toLowerCase()] || <Package className="w-4 h-4 text-hubbi-dim" />}
            </div>
        ),
        size: 50,
    }),
    columnHelper.accessor('sku', {
        header: 'SKU / Código',
        cell: (info) => <span className="font-mono text-hubbi-dim">{info.getValue() || '-'}</span>,
    }),
    columnHelper.accessor('name', {
        header: ({ column }) => {
            return (
                <button
                    className="flex items-center gap-1 hover:text-hubbi-primary"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Nombre
                    <ArrowUpDown className="w-3 h-3" />
                </button>
            );
        },
        cell: (info) => <span className="font-medium text-hubbi-text">{info.getValue()}</span>,
    }),
    columnHelper.accessor('category_id', {
        header: 'Categoría',
        cell: (info) => <span className="capitalize px-2 py-1 bg-hubbi-muted rounded-md text-xs text-hubbi-text">{info.getValue()}</span>,
    }),
    columnHelper.accessor('price_base', {
        header: 'Precio Lista',
        cell: (info) => {
            const val = info.getValue();
            return val ? <span className="text-green-500 font-medium">${val.toFixed(2)}</span> : <span className="text-hubbi-dim">-</span>;
        },
    }),
    columnHelper.accessor('cost_avg', {
        header: 'Costo Prom.',
        cell: (info) => <span className="text-hubbi-dim font-mono">${(info.getValue() || 0).toFixed(2)}</span>,
    }),
    columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => (
            <span className={clsx(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                info.getValue() === 'ACTIVE'
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
                {info.getValue() === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </span>
        ),
    }),
];

export default function InventoryTable() {
    const { data, loading } = useInventoryData();
    const { selectedItemId, selectItem } = useInventoryStore();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
                Cargando inventario...
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Table Toolbar */}
            <div className="flex items-center gap-4 bg-hubbi-card p-3 rounded-lg border border-hubbi-border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hubbi-dim" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-hubbi-bg border border-hubbi-border rounded-md focus:outline-none focus:ring-2 focus:ring-hubbi-primary text-hubbi-text placeholder-hubbi-dim"
                    />
                </div>

                {/* Export Button */}
                <button
                    onClick={() => {
                        // Prepare data for export
                        const exportData = data.map(item => ({
                            SKU: item.sku || '',
                            Nombre: item.name,
                            Tipo: item.kind,
                            Categoría: item.category_id,
                            'Precio Base': item.price_base,
                            'Costo Promedio': item.cost_avg,
                            Estado: item.status,
                            Vendible: item.is_saleable ? 'Sí' : 'No',
                            Comprable: item.is_purchasable ? 'Sí' : 'No',
                        }));

                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
                        XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Exportar
                </button>
            </div>

            {/* Table Component */}
            <div className="bg-hubbi-card rounded-lg border border-hubbi-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-hubbi-muted border-b border-hubbi-border">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="px-4 py-3 font-medium text-hubbi-dim whitespace-nowrap">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-hubbi-border">
                            {table.getRowModel().rows.map((row) => {
                                const isSelected = row.original.id === selectedItemId;
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => selectItem(row.original)}
                                        className={clsx(
                                            "cursor-pointer transition-colors hover:bg-hubbi-muted/50",
                                            isSelected && "bg-hubbi-primary/10 border-l-2 border-hubbi-primary"
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 text-hubbi-text">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}

                            {table.getRowModel().rows.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-8 text-center text-hubbi-dim">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-2 border-t border-hubbi-border text-xs text-hubbi-dim text-right">
                    Mostrando {table.getRowModel().rows.length} registros
                </div>
            </div>
        </div>
    );
}
