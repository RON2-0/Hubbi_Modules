import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from '@tanstack/react-table';
import { ClipboardList, Check, AlertTriangle, Save, ArrowUpDown, Search } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';

interface AuditLine {
    item_id: string;
    item_name: string;
    item_sku: string;
    expected_qty: number;
    counted_qty: number | null;
    difference: number | null;
    notes: string;
}

interface Audit {
    id: string;
    location_id: string;
    status: 'open' | 'reviewing' | 'closed';
    started_at: string;
    closed_at?: string;
    lines: AuditLine[];
}

const columnHelper = createColumnHelper<AuditLine>();

export const PhysicalAudit = () => {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
    const [loading, setLoading] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    useEffect(() => {
        const loadAudits = async () => {
            const data = await hubbi.data.query(
                `SELECT * FROM com_hubbi_inventory_audits ORDER BY started_at DESC LIMIT 10`
            );
            if (data && Array.isArray(data)) {
                setAudits(data.map(a => ({ ...a, lines: [] })));
            }
        };
        loadAudits();
    }, []);

    const startAudit = async (locationId: string) => {
        setLoading(true);
        const auditId = crypto.randomUUID();

        const stockSnapshot = await hubbi.data.query(
            `SELECT s.item_id, s.quantity, i.name, i.sku 
             FROM com_hubbi_inventory_stock s 
             JOIN com_hubbi_inventory_items i ON s.item_id = i.id
             WHERE s.location_id = ?`,
            [locationId]
        );

        await hubbi.data.execute(
            `INSERT INTO com_hubbi_inventory_audits (id, location_id, status, started_at) VALUES (?, ?, 'open', ?)`,
            [auditId, locationId, new Date().toISOString()]
        );

        for (const row of (stockSnapshot || [])) {
            await hubbi.data.execute(
                `INSERT INTO com_hubbi_inventory_audit_lines (audit_id, item_id, expected_qty) VALUES (?, ?, ?)`,
                [auditId, row.item_id, row.quantity]
            );
        }

        const newAudit: Audit = {
            id: auditId,
            location_id: locationId,
            status: 'open',
            started_at: new Date().toISOString(),
            lines: (stockSnapshot || []).map(row => ({
                item_id: row.item_id,
                item_name: row.name,
                item_sku: row.sku,
                expected_qty: row.quantity,
                counted_qty: null,
                difference: null,
                notes: ''
            }))
        };

        setActiveAudit(newAudit);
        setAudits([newAudit, ...audits]);
        setLoading(false);
        hubbi.notify.success('Auditoría iniciada');
    };

    const updateCount = useCallback((itemId: string, countedQty: number, notes?: string) => {
        if (!activeAudit) return;

        setActiveAudit({
            ...activeAudit,
            lines: activeAudit.lines.map(line => {
                if (line.item_id === itemId) {
                    return {
                        ...line,
                        counted_qty: countedQty,
                        difference: countedQty - line.expected_qty,
                        notes: notes || line.notes
                    };
                }
                return line;
            })
        });
    }, [activeAudit]);

    const finalizeAudit = async () => {
        if (!activeAudit) return;
        setLoading(true);

        for (const line of activeAudit.lines) {
            if (line.counted_qty !== null) {
                await hubbi.data.execute(
                    `UPDATE com_hubbi_inventory_audit_lines 
                     SET counted_qty = ?, difference = ?, notes = ? 
                     WHERE audit_id = ? AND item_id = ?`,
                    [line.counted_qty, line.difference, line.notes, activeAudit.id, line.item_id]
                );

                if (line.difference !== 0) {
                    const movementId = crypto.randomUUID();
                    await hubbi.data.execute(
                        `INSERT INTO com_hubbi_inventory_movements (id, item_id, location_id, type, reason, quantity, created_by, created_at)
                         VALUES (?, ?, ?, 'ADJUST', 'Ajuste por auditoría física', ?, 'audit_system', ?)`,
                        [movementId, line.item_id, activeAudit.location_id, Math.abs(line.difference!), new Date().toISOString()]
                    );

                    await hubbi.data.execute(
                        `UPDATE com_hubbi_inventory_stock SET quantity = ? WHERE item_id = ? AND location_id = ?`,
                        [line.counted_qty, line.item_id, activeAudit.location_id]
                    );
                }
            }
        }

        await hubbi.data.execute(
            `UPDATE com_hubbi_inventory_audits SET status = 'closed', closed_at = ? WHERE id = ?`,
            [new Date().toISOString(), activeAudit.id]
        );

        hubbi.notify.success('Auditoría finalizada. Ajustes aplicados.');
        setActiveAudit(null);
        setLoading(false);
    };

    const columns = useMemo(() => [
        columnHelper.accessor('item_name', {
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting()} className="flex items-center gap-1">
                    Producto <ArrowUpDown size={14} />
                </button>
            ),
            cell: info => (
                <div>
                    <div className="font-medium text-gray-900">{info.getValue()}</div>
                    <div className="text-xs text-gray-400 font-mono">{info.row.original.item_sku}</div>
                </div>
            ),
        }),
        columnHelper.accessor('expected_qty', {
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting()} className="flex items-center gap-1">
                    Esperado <ArrowUpDown size={14} />
                </button>
            ),
            cell: info => <span className="font-mono">{info.getValue()}</span>,
        }),
        columnHelper.display({
            id: 'counted',
            header: 'Contado',
            cell: ({ row }) => {
                const line = row.original;
                return (
                    <input
                        type="number"
                        className="w-20 text-center border rounded-lg py-1 font-mono"
                        value={line.counted_qty ?? ''}
                        onChange={(e) => updateCount(line.item_id, parseInt(e.target.value) || 0)}
                        disabled={activeAudit?.status !== 'open'}
                    />
                );
            },
        }),
        columnHelper.accessor('difference', {
            header: 'Diferencia',
            cell: info => {
                const diff = info.getValue();
                if (diff === null) return null;
                const colorClass = diff === 0 ? 'bg-green-100 text-green-700'
                    : diff > 0 ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700';
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                        {diff === 0 ? <Check size={12} /> : <AlertTriangle size={12} />}
                        {diff > 0 ? '+' : ''}{diff}
                    </span>
                );
            },
        }),
    ], [activeAudit, updateCount]);

    const table = useReactTable({
        data: activeAudit?.lines || [],
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="flex h-full bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Sidebar - Audit List */}
            <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList size={20} className="text-blue-600" />
                        Auditorías Físicas
                    </h2>
                </div>

                <div className="p-4">
                    <button
                        onClick={() => startAudit('default-location')}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        + Nueva Auditoría
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-2 space-y-2">
                    {audits.map(audit => (
                        <button
                            key={audit.id}
                            onClick={() => setActiveAudit(audit)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${activeAudit?.id === audit.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <div className="text-sm font-medium text-gray-900">
                                {new Date(audit.started_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                                {audit.status === 'open' ? '🟡 Abierta' : '🟢 Cerrada'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content - Counting */}
            <div className="flex-1 flex flex-col">
                {!activeAudit ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Selecciona o crea una auditoría</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">Conteo en Progreso</h3>
                                <p className="text-sm text-gray-500">{activeAudit.lines.length} productos</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={globalFilter}
                                        onChange={e => setGlobalFilter(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {activeAudit.status === 'open' && (
                                    <button
                                        onClick={finalizeAudit}
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <Save size={18} /> Finalizar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th key={header.id} className="text-left p-3 font-semibold text-gray-600">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className="p-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
