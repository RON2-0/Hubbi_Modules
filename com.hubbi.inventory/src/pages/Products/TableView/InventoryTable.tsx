import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import { InventoryItem } from '../../../types/inventory';
import { Package, Wrench, Briefcase, Download } from 'lucide-react';
import { useInventoryStore } from '../../../context/InventoryContext';
import { useInventoryData } from '../../../hooks/useInventoryData';
import { DataTable, DataTableColumn } from '@core/components/ui/DataTable';
import * as XLSX from 'xlsx';

export default function InventoryTable() {
    const { data, loading } = useInventoryData();
    const { selectedItemId, selectItem } = useInventoryStore();
    const [customFields, setCustomFields] = useState<{ id: string; label: string; key_name: string }[]>([]);

    // Load custom fields to build dynamic columns
    useEffect(() => {
        if (!window.hubbi?.db?.query) return;

        window.hubbi.db.query<{ id: string; label: string; key_name: string }>(
            "SELECT id, label, key_name FROM custom_fields WHERE is_active = TRUE ORDER BY display_order ASC, label ASC",
            [],
            { moduleId: 'com.hubbi.inventory' }
        ).then((res) => setCustomFields(res))
            .catch(err => console.error("Error loading custom columns", err));
    }, []);

    const TYPE_ICONS: Record<string, React.ReactNode> = {
        product: <Package className="w-4 h-4 text-blue-500" />,
        service: <Wrench className="w-4 h-4 text-orange-500" />,
        asset: <Briefcase className="w-4 h-4 text-purple-500" />,
        kit: <Package className="w-4 h-4 text-green-500" />,
    };

    const columns = useMemo<DataTableColumn<InventoryItem>[]>(() => {
        const baseCols: DataTableColumn<InventoryItem>[] = [
            {
                id: 'kind',
                accessorKey: 'kind',
                header: 'Tipo',
                width: '60px',
                align: 'center',
                cell: ({ row }) => (
                    <div className="flex justify-center" title={row.original.kind}>
                        {TYPE_ICONS[row.original.kind.toLowerCase()] || <Package className="w-4 h-4 text-hubbi-dim" />}
                    </div>
                )
            },
            {
                id: 'sku',
                accessorKey: 'sku',
                header: 'SKU / Código',
                width: '150px',
                cell: ({ row }) => <span className="font-mono text-hubbi-dim">{row.original.sku || '-'}</span>
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: 'Nombre',
                width: '300px',
                cell: ({ row }) => <span className="font-medium text-hubbi-text">{row.original.name}</span>
            },
            {
                id: 'category',
                accessorKey: 'category_id',
                header: 'Categoría',
                width: '150px',
                cell: ({ row }) => (
                    <span className="capitalize px-2 py-0.5 bg-hubbi-input rounded text-[10px] font-bold text-hubbi-dim border border-hubbi-border/50">
                        {row.original.category_id || 'Sin categoría'}
                    </span>
                )
            },
            {
                id: 'price',
                accessorKey: 'price_base',
                header: 'Precio Lista',
                width: '120px',
                align: 'right',
                cell: ({ row }) => {
                    const val = row.original.price_base;
                    return val ? <span className="text-hubbi-success font-bold font-mono text-sm">${val.toFixed(2)}</span> : <span className="text-hubbi-dim">-</span>;
                }
            },
            {
                id: 'cost',
                accessorKey: 'cost_avg',
                header: 'Costo Prom.',
                width: '120px',
                align: 'right',
                cell: ({ row }) => <span className="text-hubbi-dim font-mono text-sm">${(row.original.cost_avg || 0).toFixed(2)}</span>
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: 'Estado',
                width: '100px',
                align: 'center',
                cell: ({ row }) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.original.status === 'ACTIVE'
                        ? "bg-hubbi-success/10 text-hubbi-success border border-hubbi-success/20"
                        : "bg-hubbi-danger/10 text-hubbi-danger border border-hubbi-danger/20"
                        }`}>
                        {row.original.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                )
            }
        ];

        const dynamicCols = customFields.map(field => ({
            id: `cf_${field.key_name}`,
            header: field.label,
            width: '150px',
            accessorFn: (row: InventoryItem) => row.attributes?.[field.key_name],
            cell: ({ getValue }: { getValue: () => unknown }) => {
                const val = getValue();
                return <span className="text-hubbi-dim text-sm">{val !== null && val !== undefined ? String(val) : '-'}</span>;
            }
        })) as DataTableColumn<InventoryItem>[];

        return [...baseCols, ...dynamicCols];
    }, [customFields]);

    const handleExportExcel = () => {
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
    };

    return (
        <div className="h-full flex flex-col min-h-0">
            <DataTable
                data={data}
                columns={columns}
                getRowKey={(item: InventoryItem) => item.id}
                isLoading={loading}
                emptyMessage="No se encontraron productos en el inventario."
                onRowClick={selectItem}
                searchPlaceholder="Buscar por nombre, SKU..."
                enablePagination={true}
                pageSizeOptions={[25, 50, 100]}
                toolbarActions={
                    <button
                        onClick={handleExportExcel}
                        className="h-[42px] flex items-center justify-center gap-2 px-4 bg-hubbi-card border border-hubbi-border rounded-xl text-xs font-bold hover:border-hubbi-success hover:text-hubbi-success transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        <Download className="w-4 h-4 text-hubbi-success" />
                        Excel
                    </button>
                }
            />
        </div>
    );
}
