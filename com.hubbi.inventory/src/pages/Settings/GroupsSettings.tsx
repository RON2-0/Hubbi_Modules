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
import { Layers, Plus, Search, Trash2, Edit2, X } from 'lucide-react';
import { ItemGroup, Category } from '../../types/inventory';
import { clsx } from 'clsx';
// Core UI Components
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';

const columnHelper = createColumnHelper<ItemGroup>();

export default function GroupsSettings() {
    const [groups, setGroups] = useState<ItemGroup[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', category_id: '' });
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [groupsResult, categoriesResult] = await Promise.all([
                window.hubbi.db.query<ItemGroup>(
                    "SELECT * FROM item_groups ORDER BY display_order ASC, name ASC",
                    [],
                    { moduleId: 'com.hubbi.inventory' }
                ),
                window.hubbi.db.query<Category>(
                    "SELECT id, name FROM categories WHERE is_active = true ORDER BY name ASC",
                    [],
                    { moduleId: 'com.hubbi.inventory' }
                )
            ]);
            setGroups(groupsResult);
            setCategories(categoriesResult);
        } catch (err) {
            console.error("Error fetching groups", err);
            window.hubbi.notify("Error al cargar grupos", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveGroup = async () => {
        if (!formData.name.trim()) {
            window.hubbi.notify("El nombre es requerido", "warning");
            return;
        }

        setIsSaving(true);
        try {
            if (editingGroup) {
                await window.hubbi.db.execute(
                    `UPDATE item_groups SET name = ?, description = ?, category_id = ? WHERE id = ?`,
                    [formData.name, formData.description, formData.category_id || null, editingGroup.id],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Grupo actualizado", "success");
            } else {
                const id = crypto.randomUUID();
                await window.hubbi.db.execute(
                    `INSERT INTO item_groups (id, name, description, category_id, display_order) VALUES (?, ?, ?, ?, ?)`,
                    [id, formData.name, formData.description, formData.category_id || null, groups.length],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Grupo creado", "success");
            }

            setIsFormOpen(false);
            setEditingGroup(null);
            setFormData({ name: '', description: '', category_id: '' });
            fetchData();
        } catch (err) {
            console.error("Error saving group", err);
            window.hubbi.notify("Error al guardar grupo", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteGroup = useCallback(async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este grupo?")) return;
        try {
            await window.hubbi.db.delete('item_groups', id, { moduleId: 'com.hubbi.inventory' });
            window.hubbi.notify("Grupo eliminado", "success");
            fetchData();
        } catch (err) {
            console.error("Error deleting group", err);
            window.hubbi.notify("Error al eliminar grupo", "error");
        }
    }, [fetchData]);

    const openEditGroup = (group: ItemGroup) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description || '',
            category_id: group.category_id || ''
        });
        setIsFormOpen(true);
    };

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: () => <div className="flex items-center gap-2">Grupo</div>,
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-hubbi-primary/5 rounded-lg">
                        <Layers className="w-4 h-4 text-hubbi-primary" />
                    </div>
                    <div>
                        <span className="font-bold text-hubbi-text">{info.getValue()}</span>
                        {info.row.original.description && (
                            <p className="text-xs text-hubbi-dim truncate max-w-[200px]">{info.row.original.description}</p>
                        )}
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('category_id', {
            header: 'Categoría',
            cell: info => {
                const category = categories.find(c => c.id === info.getValue());
                return category ? (
                    <span className="text-sm text-hubbi-dim">{category.name}</span>
                ) : (
                    <span className="text-xs text-hubbi-dim/50 italic">Sin categoría</span>
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
                        {info.getValue() !== false ? 'Activo' : 'Inactivo'}
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
                        onClick={() => openEditGroup(info.row.original)}
                        className="p-2 text-hubbi-dim hover:text-hubbi-primary hover:bg-hubbi-primary/10 rounded-lg transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => handleDeleteGroup(info.row.original.id)}
                        className="p-2 text-hubbi-dim hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        })
    ], [categories, handleDeleteGroup]);

    const table = useReactTable({
        data: groups,
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
                        Grupos
                        {loading && <div className="w-4 h-4 border-2 border-hubbi-primary border-t-transparent rounded-full animate-spin" />}
                    </h2>
                    <p className="text-sm text-hubbi-dim mt-1">
                        Agrupa tus productos de forma flexible (opcional al crear productos).
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingGroup(null);
                        setFormData({ name: '', description: '', category_id: '' });
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    Nuevo Grupo
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar grupo..."
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
                            {!loading && groups.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center border border-hubbi-border">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Layers size={48} />
                                            <p className="font-bold">No se encontraron grupos</p>
                                            <p className="text-sm">Crea tu primer grupo para organizar productos</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t border-hubbi-border bg-hubbi-muted/10 flex items-center justify-between">
                    <span className="text-xs text-hubbi-dim font-medium">
                        {loading ? 'Sincronizando...' : `${groups.length} grupos`}
                    </span>
                </div>
            </div>

            {/* Group Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-hubbi-card border border-hubbi-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-hubbi-text">
                                {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-hubbi-muted rounded-lg">
                                <X size={18} className="text-hubbi-dim" />
                            </button>
                        </div>

                        <Input
                            label="Nombre *"
                            value={formData.name}
                            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Premium"
                        />

                        <Input
                            label="Descripción"
                            value={formData.description}
                            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                            placeholder="Descripción opcional..."
                        />

                        <Select
                            label="Categoría (opcional)"
                            options={[
                                { value: '', label: 'Sin categoría' },
                                ...categories.map(c => ({ value: c.id, label: c.name }))
                            ]}
                            value={formData.category_id}
                            onChange={(val) => setFormData(f => ({ ...f, category_id: String(val ?? '') }))}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-hubbi-border">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveGroup} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : (editingGroup ? 'Guardar Cambios' : 'Crear Grupo')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
