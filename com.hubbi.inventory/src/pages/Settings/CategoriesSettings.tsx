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
import { Tags, Plus, Search, Trash2, Edit2, Check, X } from 'lucide-react';
import { Category } from '../../types/inventory';
import { clsx } from 'clsx';

// Core UI Components
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

const columnHelper = createColumnHelper<Category>();

// Color palette for categories
const CATEGORY_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1'
];

export default function CategoriesSettings() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', color: CATEGORY_COLORS[0], icon: 'Package' });
    const [isSaving, setIsSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const results = await window.hubbi.db.query<Category>(
                "SELECT * FROM categories ORDER BY display_order ASC, name ASC",
                [],
                { moduleId: 'com.hubbi.inventory' }
            );
            setCategories(results);
        } catch (err) {
            console.error("Error fetching categories", err);
            window.hubbi.notify("Error al cargar categorías", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
        try {
            await window.hubbi.db.delete('categories', id, { moduleId: 'com.hubbi.inventory' });
            window.hubbi.notify("Categoría eliminada", "success");
            fetchCategories();
        } catch (err) {
            console.error("Error deleting category", err);
            window.hubbi.notify("Error al eliminar categoría", "error");
        }
    }, [fetchCategories]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            window.hubbi.notify("El nombre es requerido", "warning");
            return;
        }

        setIsSaving(true);
        try {
            if (editingCategory) {
                // Update
                await window.hubbi.db.execute(
                    `UPDATE categories SET name = ?, description = ?, color = ?, icon = ? WHERE id = ?`,
                    [formData.name, formData.description, formData.color, formData.icon, editingCategory.id],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Categoría actualizada", "success");
            } else {
                // Insert
                const id = crypto.randomUUID();
                await window.hubbi.db.execute(
                    `INSERT INTO categories (id, name, description, color, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, formData.name, formData.description, formData.color, formData.icon, categories.length],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Categoría creada", "success");
            }

            setIsFormOpen(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', color: CATEGORY_COLORS[0], icon: 'Package' });
            fetchCategories();
        } catch (err) {
            console.error("Error saving category", err);
            window.hubbi.notify("Error al guardar categoría", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            color: category.color || CATEGORY_COLORS[0],
            icon: category.icon || 'Package'
        });
        setIsFormOpen(true);
    };

    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: () => <div className="flex items-center gap-2">Categoría</div>,
            cell: info => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: info.row.original.color || CATEGORY_COLORS[0] }}
                    >
                        <Tags className="w-4 h-4 text-white" />
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
    ], [handleDelete]);

    const table = useReactTable({
        data: categories,
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
                        Categorías
                        {loading && <div className="w-4 h-4 border-2 border-hubbi-primary border-t-transparent rounded-full animate-spin" />}
                    </h2>
                    <p className="text-sm text-hubbi-dim mt-1">
                        Organiza tu inventario con categorías. Cada producto debe pertenecer a una categoría.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', description: '', color: CATEGORY_COLORS[0], icon: 'Package' });
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    Nueva Categoría
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar categoría..."
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
                            {!loading && categories.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center border border-hubbi-border">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Tags size={48} />
                                            <p className="font-bold">No se encontraron categorías</p>
                                            <p className="text-sm">Crea tu primera categoría para organizar el inventario</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t border-hubbi-border bg-hubbi-muted/10 flex items-center justify-between">
                    <span className="text-xs text-hubbi-dim font-medium">
                        {loading ? 'Sincronizando...' : `${categories.length} categorías`}
                    </span>
                </div>
            </div>

            {/* Inline Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-hubbi-card border border-hubbi-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-hubbi-text">
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-hubbi-muted rounded-lg">
                                <X size={18} className="text-hubbi-dim" />
                            </button>
                        </div>

                        <Input
                            label="Nombre *"
                            value={formData.name}
                            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Electrónicos"
                        />

                        <Input
                            label="Descripción"
                            value={formData.description}
                            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                            placeholder="Descripción opcional..."
                        />

                        <div>
                            <label className="text-xs font-bold uppercase text-hubbi-dim block mb-2">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORY_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, color }))}
                                        className={clsx(
                                            "w-8 h-8 rounded-lg transition-all",
                                            formData.color === color && "ring-2 ring-offset-2 ring-hubbi-primary"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {formData.color === color && <Check size={14} className="text-white m-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-hubbi-border">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : (editingCategory ? 'Guardar Cambios' : 'Crear Categoría')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
