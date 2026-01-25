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
import { PenTool, Plus, Search, Trash2, Edit2, X, Type, Hash, ToggleLeft, List, Calendar } from 'lucide-react';
import { CustomFieldDefinition, CustomFieldType } from '../../types/inventory';
import { clsx } from 'clsx';

// Core UI Components
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';

const columnHelper = createColumnHelper<CustomFieldDefinition>();

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string; icon: typeof Type }[] = [
    { value: 'text', label: 'Texto', icon: Type },
    { value: 'number', label: 'Número', icon: Hash },
    { value: 'boolean', label: 'Sí/No', icon: ToggleLeft },
    { value: 'select', label: 'Selector', icon: List },
    { value: 'date', label: 'Fecha', icon: Calendar },
];

const SCOPE_OPTIONS = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'product', label: 'Solo Productos' },
    { value: 'service', label: 'Solo Servicios' },
    { value: 'asset', label: 'Solo Activos' },
];

export default function CustomFieldsSettings() {
    const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
    const [formData, setFormData] = useState({
        label: '',
        key_name: '',
        type: 'text' as CustomFieldType,
        options: [] as string[],
        default_value: '',
        group_name: 'General',
        scope: 'all' as string
    });
    const [newOption, setNewOption] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchFields = useCallback(async () => {
        try {
            setLoading(true);
            const results = await window.hubbi.db.query<CustomFieldDefinition>(
                "SELECT * FROM custom_fields ORDER BY group_name ASC, label ASC",
                [],
                { moduleId: 'com.hubbi.inventory' }
            );
            // Parse options JSON
            const parsed = results.map(f => ({
                ...f,
                options: typeof f.options === 'string' ? JSON.parse(f.options) : (f.options || [])
            }));
            setFields(parsed);
        } catch (err) {
            console.error("Error fetching custom fields", err);
            window.hubbi.notify("Error al cargar campos personalizados", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFields();
    }, [fetchFields]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este campo? Los datos existentes en productos no se eliminarán.")) return;
        try {
            await window.hubbi.db.delete('custom_fields', id, { moduleId: 'com.hubbi.inventory' });
            window.hubbi.notify("Campo eliminado", "success");
            fetchFields();
        } catch (err) {
            console.error("Error deleting field", err);
            window.hubbi.notify("Error al eliminar campo", "error");
        }
    }, [fetchFields]);

    const handleToggleActive = useCallback(async (field: CustomFieldDefinition) => {
        try {
            await window.hubbi.db.execute(
                "UPDATE custom_fields SET is_active = ? WHERE id = ?",
                [!field.is_active, field.id],
                { moduleId: 'com.hubbi.inventory' }
            );
            window.hubbi.notify(field.is_active ? "Campo desactivado" : "Campo activado", "success");
            fetchFields();
        } catch (err) {
            console.error("Error toggling field", err);
            window.hubbi.notify("Error al actualizar campo", "error");
        }
    }, [fetchFields]);

    const generateKeyName = (label: string) => {
        return label
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    };

    const handleSave = async () => {
        if (!formData.label.trim() || !formData.key_name.trim()) {
            window.hubbi.notify("Nombre y clave son requeridos", "warning");
            return;
        }

        if (formData.type === 'select' && formData.options.length === 0) {
            window.hubbi.notify("Agrega al menos una opción para el selector", "warning");
            return;
        }

        setIsSaving(true);
        try {
            const optionsJson = JSON.stringify(formData.options);

            if (editingField) {
                await window.hubbi.db.execute(
                    `UPDATE custom_fields SET label = ?, key_name = ?, type = ?, options = ?, default_value = ?, group_name = ?, scope = ? WHERE id = ?`,
                    [formData.label, formData.key_name, formData.type, optionsJson, formData.default_value, formData.group_name, formData.scope, editingField.id],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Campo actualizado", "success");
            } else {
                const id = crypto.randomUUID();
                await window.hubbi.db.execute(
                    `INSERT INTO custom_fields (id, label, key_name, type, options, default_value, group_name, scope, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, formData.label, formData.key_name, formData.type, optionsJson, formData.default_value, formData.group_name, formData.scope, true],
                    { moduleId: 'com.hubbi.inventory' }
                );
                window.hubbi.notify("Campo creado", "success");
            }

            setIsFormOpen(false);
            setEditingField(null);
            setFormData({ label: '', key_name: '', type: 'text', options: [], default_value: '', group_name: 'General', scope: 'all' });
            fetchFields();
        } catch (err) {
            console.error("Error saving field", err);
            window.hubbi.notify("Error al guardar campo", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const openEdit = (field: CustomFieldDefinition) => {
        setEditingField(field);
        setFormData({
            label: field.label,
            key_name: field.key_name,
            type: field.type,
            options: field.options || [],
            default_value: field.default_value || '',
            group_name: field.group_name || 'General',
            scope: field.scope || 'all'
        });
        setIsFormOpen(true);
    };

    const addOption = () => {
        if (!newOption.trim()) return;
        if (formData.options.includes(newOption.trim())) {
            window.hubbi.notify("Esta opción ya existe", "warning");
            return;
        }
        setFormData(f => ({ ...f, options: [...f.options, newOption.trim()] }));
        setNewOption('');
    };

    const removeOption = (opt: string) => {
        setFormData(f => ({ ...f, options: f.options.filter(o => o !== opt) }));
    };

    const columns = useMemo(() => [
        columnHelper.accessor('label', {
            header: () => <div className="flex items-center gap-2">Campo</div>,
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-hubbi-primary/5 rounded-lg">
                        {(() => {
                            const TypeIcon = FIELD_TYPE_OPTIONS.find(t => t.value === info.row.original.type)?.icon || PenTool;
                            return <TypeIcon className="w-4 h-4 text-hubbi-primary" />;
                        })()}
                    </div>
                    <div>
                        <span className="font-bold text-hubbi-text">{info.getValue()}</span>
                        <p className="text-xs text-hubbi-dim font-mono">{info.row.original.key_name}</p>
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('type', {
            header: 'Tipo',
            cell: info => (
                <span className="px-2 py-1 bg-hubbi-muted/30 rounded text-xs text-hubbi-text capitalize">
                    {FIELD_TYPE_OPTIONS.find(t => t.value === info.getValue())?.label || info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor('group_name', {
            header: 'Grupo',
            cell: info => (
                <span className="text-sm text-hubbi-dim">{info.getValue() || 'General'}</span>
            )
        }),
        columnHelper.accessor('scope', {
            header: 'Aplica a',
            cell: info => (
                <span className="text-xs text-hubbi-dim">
                    {SCOPE_OPTIONS.find(s => s.value === info.getValue())?.label || 'Todos'}
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
                        {info.getValue() ? 'Activo' : 'Inactivo'}
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
        data: fields,
        columns,
        columnResizeMode: 'onChange',
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // Group fields by group_name for display
    const groupedFields = useMemo(() => {
        const groups: Record<string, CustomFieldDefinition[]> = {};
        fields.forEach(f => {
            const g = f.group_name || 'General';
            if (!groups[g]) groups[g] = [];
            groups[g].push(f);
        });
        return groups;
    }, [fields]);

    return (
        <div className="p-6 space-y-6 flex flex-col h-full animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-hubbi-text tracking-tight flex items-center gap-3">
                        Campos Personalizados
                        {loading && <div className="w-4 h-4 border-2 border-hubbi-primary border-t-transparent rounded-full animate-spin" />}
                    </h2>
                    <p className="text-sm text-hubbi-dim mt-1">
                        Define atributos adicionales para tus productos (ej: Color, Material, Voltaje).
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingField(null);
                        setFormData({ label: '', key_name: '', type: 'text', options: [], default_value: '', group_name: 'General', scope: 'all' });
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6"
                >
                    <Plus size={18} />
                    Nuevo Campo
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar campo..."
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
                            {!loading && fields.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center border border-hubbi-border">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <PenTool size={48} />
                                            <p className="font-bold">No hay campos personalizados</p>
                                            <p className="text-sm">Crea tu primer campo para agregar atributos a productos</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t border-hubbi-border bg-hubbi-muted/10 flex items-center justify-between">
                    <span className="text-xs text-hubbi-dim font-medium">
                        {loading ? 'Sincronizando...' : `${fields.length} campos • ${Object.keys(groupedFields).length} grupos`}
                    </span>
                </div>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-hubbi-card border border-hubbi-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-hubbi-text">
                                {editingField ? 'Editar Campo' : 'Nuevo Campo Personalizado'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-hubbi-muted rounded-lg">
                                <X size={18} className="text-hubbi-dim" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Nombre visible *"
                                value={formData.label}
                                onChange={(e) => {
                                    const label = e.target.value;
                                    setFormData(f => ({
                                        ...f,
                                        label,
                                        key_name: editingField ? f.key_name : generateKeyName(label)
                                    }));
                                }}
                                placeholder="Ej: Color"
                            />
                            <Input
                                label="Clave interna *"
                                value={formData.key_name}
                                onChange={(e) => setFormData(f => ({ ...f, key_name: e.target.value }))}
                                placeholder="Ej: color"
                                className="font-mono text-sm"
                                disabled={!!editingField}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Tipo de campo"
                                options={FIELD_TYPE_OPTIONS.map(t => ({ value: t.value, label: t.label }))}
                                value={formData.type}
                                onChange={(val) => setFormData(f => ({ ...f, type: val as CustomFieldType, options: val === 'select' ? f.options : [] }))}
                            />
                            <Select
                                label="Aplica a"
                                options={SCOPE_OPTIONS}
                                value={formData.scope}
                                onChange={(val) => setFormData(f => ({ ...f, scope: String(val) }))}
                            />
                        </div>

                        <Input
                            label="Grupo (para organizar en UI)"
                            value={formData.group_name}
                            onChange={(e) => setFormData(f => ({ ...f, group_name: e.target.value }))}
                            placeholder="Ej: Especificaciones Técnicas"
                        />

                        {formData.type !== 'boolean' && formData.type !== 'select' && (
                            <Input
                                label="Valor por defecto (opcional)"
                                value={formData.default_value}
                                onChange={(e) => setFormData(f => ({ ...f, default_value: e.target.value }))}
                                placeholder="Valor inicial..."
                            />
                        )}

                        {/* Options for Select type */}
                        {formData.type === 'select' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-hubbi-dim uppercase">Opciones del selector *</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        placeholder="Nueva opción..."
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                    />
                                    <Button variant="secondary" onClick={addOption}>Agregar</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.options.map(opt => (
                                        <span
                                            key={opt}
                                            className="px-3 py-1.5 bg-hubbi-muted/30 border border-hubbi-border rounded-lg text-sm flex items-center gap-2"
                                        >
                                            {opt}
                                            <button onClick={() => removeOption(opt)} className="hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {formData.options.length === 0 && (
                                    <p className="text-xs text-amber-500">Agrega al menos una opción</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-hubbi-border">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : (editingField ? 'Guardar Cambios' : 'Crear Campo')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
