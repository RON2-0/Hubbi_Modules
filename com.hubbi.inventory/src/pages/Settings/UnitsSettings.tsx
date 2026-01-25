import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel
} from '@tanstack/react-table';
import { Ruler, Plus, Search, Trash2, Edit2, X } from 'lucide-react';
import { UnitOfMeasure } from '../../types/inventory';
import { clsx } from 'clsx';

// Core UI Components
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

const columnHelper = createColumnHelper<UnitOfMeasure>();

export default function UnitsSettings() {
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
    const [formData, setFormData] = useState({ name: '', symbol: '' });
    const [isSaving, setIsSaving] = useState(false);

    const fetchUnits = useCallback(async () => {
        try {
            setLoading(true);
            const results = await window.hubbi.db.query<UnitOfMeasure>(
                "SELECT * FROM uoms ORDER BY name ASC",
                [],
                { moduleId: 'com.hubbi.inventory' }
            );
            setUnits(results);
        } catch (err) {
            console.error("Error fetching units", err);
            window.hubbi.notify("Error al cargar unidades", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta unidad? Esto puede afectar productos que la usen.")) return;
        try {
            await window.hubbi.db.delete('uoms', id, { moduleId: 'com.hubbi.inventory' });
            window.hubbi.notify("Unidad eliminada", "success");
            fetchUnits();
        } catch (err) {
            console.error("Error deleting unit", err);
            window.hubbi.notify("Error al eliminar unidad", "error");
        }
    }, [fetchUnits]);

    const handleToggleActive = useCallback(async (unit: UnitOfMeasure) => {
        try {
            await window.hubbi.db.execute(
                "UPDATE uoms SET is_active = ? WHERE id = ?",
                [!unit.is_active, unit.id],
                { moduleId: 'com.hubbi.inventory' }
            );
            window.hubbi.notify(unit.is_active ? "Unidad desactivada" : "Unidad activada", "success");
            fetchUnits();
        } catch (err) {
            console.error("Error toggling unit", err);
            window.hubbi.notify("Error al actualizar unidad", "error");
        }
    }, [fetchUnits]);

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.symbol.trim()) {
            window.hubbi.notify("Nombre y símbolo son requeridos", "warning");
            return;
        }

        setIsSaving(true);
        try {
            if (editingUnit) {
                await window.hubbi.db.execute(
                    `UPDATE uoms SET name = ?, symbol = ? WHERE id = ?`,
                    [formData.name, formData.symbol, editingUnit.id],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Unidad actualizada", "success");
            } else {
                const id = crypto.randomUUID();
                await window.hubbi.db.execute(
                    `INSERT INTO uoms (id, name, symbol, is_active) VALUES (?, ?, ?, ?)`,
                    [id, formData.name, formData.symbol, true],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Unidad creada", "success");
            }

            setIsFormOpen(false);
            setEditingUnit(null);
            setFormData({ name: '', symbol: '' });
            fetchUnits();
        } catch (err) {
            console.error("Error saving unit", err);
            window.hubbi.notify("Error al guardar unidad", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const openEdit = (unit: UnitOfMeasure) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            symbol: unit.symbol
        });
        setIsFormOpen(true);
    };

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: () => <div className="flex items-center gap-2">Nombre</div>,
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-hubbi-primary/5 rounded-lg">
                        <Ruler className="w-4 h-4 text-hubbi-primary" />
                    </div>
                    <span className="font-bold text-hubbi-text">{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('symbol', {
            header: 'Símbolo',
            cell: info => (
                <span className="px-2 py-1 bg-hubbi-muted/30 rounded font-mono text-sm text-hubbi-text">
                    {info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor('is_active', {
            header: () => <div className="text-center">Estado</div>,
            cell: info => (
                <div className="flex justify-center">
                    <button
                        onClick={() => handleToggleActive(info.row.original)}
                        className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors",
                            info.getValue()
                                ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                        )}
                    >
                        {info.getValue() ? 'Activa' : 'Inactiva'}
                    </button>
                </div>
            )
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-right px-2">Acciones</div>,
            cell: info => (
                <div className="flex justify-end gap-1 px-2">
                    <button
                        onClick={() => openEdit(info.row.original)}
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
    ], [handleDelete, handleToggleActive]);

    const table = useReactTable({
        data: units,
        columns,
        columnResizeMode: 'onChange',
        state: { sorting, globalFilter },
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
                        Unidades de Medida
                        {loading && <div className="w-4 h-4 border-2 border-hubbi-primary border-t-transparent rounded-full animate-spin" />}
                    </h2>
                    <p className="text-sm text-hubbi-dim mt-1">
                        Define las unidades base y presentaciones para tus productos.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingUnit(null);
                        setFormData({ name: '', symbol: '' });
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    Nueva Unidad
                </Button>
            </div>

            {/* Common Units Quick Add */}
            {units.length === 0 && !loading && (
                <div className="p-4 bg-hubbi-primary/5 border border-hubbi-primary/20 rounded-xl">
                    <p className="text-sm text-hubbi-text mb-3">
                        <strong>Sugerencia:</strong> Agrega unidades comunes para empezar rápido:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: 'Unidad', symbol: 'u' },
                            { name: 'Pieza', symbol: 'pz' },
                            { name: 'Kilogramo', symbol: 'kg' },
                            { name: 'Libra', symbol: 'lb' },
                            { name: 'Litro', symbol: 'L' },
                            { name: 'Metro', symbol: 'm' },
                            { name: 'Caja', symbol: 'caja' },
                            { name: 'Docena', symbol: 'doc' },
                        ].map(u => (
                            <button
                                key={u.symbol}
                                onClick={async () => {
                                    const id = crypto.randomUUID();
                                    await window.hubbi.db.execute(
                                        `INSERT INTO uoms (id, name, symbol, is_active) VALUES (?, ?, ?, ?)`,
                                        [id, u.name, u.symbol, true],
                                        { moduleId: 'com.hubbi.inventory' }
                                    );
                                    fetchUnits();
                                }}
                                className="px-3 py-1.5 bg-hubbi-card border border-hubbi-border rounded-lg text-sm hover:border-hubbi-primary hover:text-hubbi-primary transition-colors"
                            >
                                {u.name} <span className="text-hubbi-dim">({u.symbol})</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar unidad..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        startIcon={<Search size={16} className="text-hubbi-dim" />}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 min-h-0 bg-hubbi-card border border-hubbi-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-auto flex-1 no-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0 border-collapse">
                        <thead className="bg-hubbi-muted/30 sticky top-0 z-10">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className="relative px-6 py-4 text-[10px] font-black uppercase tracking-widest text-hubbi-dim border border-hubbi-border cursor-pointer hover:text-hubbi-primary transition-colors group select-none whitespace-nowrap"
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: ' ↑',
                                                    desc: ' ↓',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>

                                            {/* Resizer */}
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                onClick={(e) => e.stopPropagation()}
                                                className={clsx(
                                                    "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none",
                                                    header.column.getIsResizing() ? "bg-hubbi-primary" : "bg-transparent group-hover:bg-hubbi-border"
                                                )}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="group hover:bg-hubbi-primary/5 transition-all duration-200"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap border border-hubbi-border overflow-hidden text-ellipsis" style={{ width: cell.column.getSize() }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && units.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center border border-hubbi-border">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Ruler size={48} />
                                            <p className="font-bold">No se encontraron unidades</p>
                                            <p className="text-sm">Crea tu primera unidad de medida</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t border-hubbi-border bg-hubbi-muted/10 flex items-center justify-between">
                    <span className="text-xs text-hubbi-dim font-medium">
                        {loading ? 'Sincronizando...' : `${units.length} unidades`}
                    </span>
                </div>
            </div>

            {/* Inline Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-hubbi-card border border-hubbi-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-hubbi-text">
                                {editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-hubbi-muted rounded-lg">
                                <X size={18} className="text-hubbi-dim" />
                            </button>
                        </div>

                        <Input
                            label="Nombre *"
                            value={formData.name}
                            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Kilogramo"
                        />

                        <Input
                            label="Símbolo *"
                            value={formData.symbol}
                            onChange={(e) => setFormData(f => ({ ...f, symbol: e.target.value }))}
                            placeholder="Ej: kg"
                            className="font-mono"
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-hubbi-border">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : (editingUnit ? 'Guardar Cambios' : 'Crear Unidad')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
