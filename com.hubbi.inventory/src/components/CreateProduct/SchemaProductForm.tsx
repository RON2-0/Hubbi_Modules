
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import clsx from 'clsx';
import {
    Package, Shield, DollarSign,
    X, Layers, Settings, Plus, Trash2, Barcode
} from 'lucide-react';

// Hubbi Core Imports (Relative paths preserved from original)
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';
import { ActionLock } from '../../../../../Hubbi/src/components/ui/ActionLock';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

// Local UI
import { Toggle } from '../ui/Toggle';

// Types & Hooks
import { InventoryItem, CustomFieldDefinition, UnitOfMeasure, Category, ItemGroup } from '../../types/inventory';
// import { useInventorySettings } from '../../context/InventoryContext'; // Unused if removing subgroupsEnabled usage if it was the only one

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Partial<InventoryItem>;
}

export const SchemaProductForm: React.FC<Props> = ({ open, onClose, onSuccess, initialData }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'PRICING' | 'ATTRIBUTES'>('DETAILS');

    // Dynamic Data
    const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
    const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [groups, setGroups] = useState<ItemGroup[]>([]);
    const [hasWarehouses, setHasWarehouses] = useState<boolean | null>(null);

    // Feature flags
    // const subgroupsEnabled = useInventorySettings(s => s.subgroupsEnabled);

    const context = typeof window !== 'undefined' ? window.hubbi?.getContext() : null;

    const { register, control, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm({
        defaultValues: {
            sku: '',
            name: '',
            description: '',
            photo_url: '',
            type: 'product',
            base_unit_id: '',
            price_base: 0,
            cost_avg: 0,
            is_saleable: true,
            is_purchasable: true,
            is_tax_exempt: false,
            has_expiration: false,
            has_warranty: false,

            // subgroup_id: '', // Removed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            attributes: {} as Record<string, any>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            additional_uoms: [] as any[], // For multi-uom pricing
            ...initialData
        }
    });

    const { fields: uomFields, append: appendUom, remove: removeUom } = useFieldArray({
        control,
        name: "additional_uoms"
    });

    const selectedType = watch('type');
    const watchedBaseUnit = watch('base_unit_id');
    const isSaleable = watch('is_saleable');
    const priceBase = watch('price_base');
    const watchedCategoryId = watch('category_id');
    const watchedGroupId = watch('group_id');

    // Load Dependencies
    useEffect(() => {
        if (!open) {
            reset();
            setHasWarehouses(null);
            return;
        }

        const loadData = async () => {
            try {
                // 1. Load UOMs
                const uomResults = await window.hubbi.db.query<UnitOfMeasure>(
                    "SELECT * FROM uoms WHERE is_active = TRUE",
                    [], { moduleId: 'com.hubbi.inventory' }
                );
                setUoms(uomResults);
                if (uomResults.length > 0 && !watchedBaseUnit) {
                    setValue('base_unit_id', uomResults[0].id);
                }

                // 2. Load Custom Fields (Schema)
                const fieldResults = await window.hubbi.db.query<CustomFieldDefinition>(
                    "SELECT * FROM custom_fields WHERE is_active = TRUE",
                    [], { moduleId: 'com.hubbi.inventory' }
                );
                setCustomFields(fieldResults);

                // 3. Load Categories
                const categoryResults = await window.hubbi.db.query<Category>(
                    "SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order ASC, name ASC",
                    [], { moduleId: 'com.hubbi.inventory' }
                );
                setCategories(categoryResults);

                // 4. Load Groups
                const groupResults = await window.hubbi.db.query<ItemGroup>(
                    "SELECT * FROM item_groups WHERE is_active = TRUE ORDER BY display_order ASC, name ASC",
                    [], { moduleId: 'com.hubbi.inventory' }
                );
                setGroups(groupResults);

                // 5. Load Subgroups - REMOVED
                // const subgroupResults = await window.hubbi.db.query<Subgroup>(...);
                // setSubgroups(subgroupResults);

                // 6. Check Warehouses
                const warehouseCheck = await window.hubbi.db.query(
                    "SELECT COUNT(*) as count FROM warehouses WHERE sub_hub_id = ?",
                    [context?.subHubId], { moduleId: 'com.hubbi.inventory' }
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const count = (warehouseCheck[0] as any)?.count || 0;
                setHasWarehouses(count > 0);

            } catch (err) {
                console.error("Failed to load dependencies", err);
            }
        };
        loadData();
    }, [open, context?.subHubId, reset, setValue, watchedBaseUnit]);

    if (!open) return null;

    // Filter Schema
    const visibleFields = customFields.filter(f => f.scope === 'all' || f.scope === selectedType);
    const groupedFields = visibleFields.reduce((acc, field) => {
        const group = field.group_name || 'General';
        if (!acc[group]) acc[group] = [];
        acc[group].push(field);
        return acc;
    }, {} as Record<string, CustomFieldDefinition[]>);


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFormSubmit = async (data: any) => {
        if (hasWarehouses === false) return;
        setIsSaving(true);
        try {
            const id = crypto.randomUUID();

            // Prepare Attributes JSON
            const attributesJson = JSON.stringify(data.attributes || {});

            await window.hubbi.db.insert('items', {
                id,
                sku: data.sku || null,
                name: data.name,
                description: data.description || null,
                photo_url: data.photo_url || null,
                type: data.type,
                base_unit_id: data.base_unit_id,
                price_base: data.price_base,
                cost_avg: data.cost_avg,
                is_saleable: data.is_saleable,
                is_purchasable: data.is_purchasable,
                is_tax_exempt: data.is_tax_exempt,
                has_expiration: data.has_expiration,
                has_warranty: data.has_warranty,
                attributes: attributesJson,
                is_active: true
            }, { moduleId: 'com.hubbi.inventory' });

            // Save Additional Prices (Item UOMs)
            if (data.additional_uoms && data.additional_uoms.length > 0) {
                for (const uom of data.additional_uoms) {
                    if (!uom.uom_id) continue;

                    await window.hubbi.db.insert('item_uoms', {
                        id: crypto.randomUUID(),
                        item_id: id,
                        uom_id: uom.uom_id,
                        conversion_factor: uom.conversion_factor || 1,
                        sale_price: uom.sale_price || 0,
                        barcode: uom.barcode || null,
                        is_default_sale: false
                    }, { moduleId: 'com.hubbi.inventory' });
                }
            }

            window.hubbi.notify("Producto creado correctamente", "success");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error creating item", err);
            window.hubbi.notify("Error al crear el producto", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => !isSaving && onClose()}></div>

            <ActionLock locked={isSaving} loadingText="Guardando...">
                <div className="relative bg-hubbi-card border border-hubbi-border w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="p-6 border-b border-hubbi-border flex items-center justify-between bg-hubbi-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-hubbi-primary/10 rounded-xl">
                                <Package className="text-hubbi-primary w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-hubbi-text">Nuevo Item</h2>
                                <p className="text-sm text-hubbi-dim">Registra un nuevo producto, servicio o activo.</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-hubbi-muted rounded-full text-hubbi-dim hover:text-hubbi-text transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Warehouse Warning */}
                    {hasWarehouses === false && (
                        <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                            <Shield className="text-red-500 w-6 h-6" />
                            <div className="flex-1">
                                <h4 className="text-base font-black text-red-500 uppercase">Sin Bodegas</h4>
                                <p className="text-sm text-red-500/80 mt-1">
                                    No puedes crear ítems sin bodegas configuradas en esta sucursal.
                                </p>
                            </div>
                            <Button onClick={() => window.hubbi.navigate('/settings/warehouses')} variant="danger">
                                Configurar
                            </Button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-hubbi-border bg-hubbi-card px-6 pt-2">
                        <button
                            onClick={() => setActiveTab('DETAILS')}
                            className={clsx("px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", activeTab === 'DETAILS' ? "text-hubbi-primary border-hubbi-primary" : "text-hubbi-dim border-transparent hover:text-hubbi-text")}
                        >
                            <Layers size={16} /> Detalles Básicos
                        </button>
                        {(isSaleable || selectedType === 'product' || selectedType === 'service') && (
                            <button
                                onClick={() => setActiveTab('PRICING')}
                                className={clsx("px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", activeTab === 'PRICING' ? "text-hubbi-primary border-hubbi-primary" : "text-hubbi-dim border-transparent hover:text-hubbi-text")}
                            >
                                <DollarSign size={16} /> Precios & Unidades
                            </button>
                        )}
                        {visibleFields.length > 0 && (
                            <button
                                onClick={() => setActiveTab('ATTRIBUTES')}
                                className={clsx("px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", activeTab === 'ATTRIBUTES' ? "text-hubbi-primary border-hubbi-primary" : "text-hubbi-dim border-transparent hover:text-hubbi-text")}
                            >
                                <Settings size={16} /> Características ({visibleFields.length})
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className={clsx("flex-1 overflow-y-auto p-6 space-y-6 bg-hubbi-card", hasWarehouses === false && "opacity-50 pointer-events-none")}>

                        {/* --- TAB: DETAILS --- */}
                        {activeTab === 'DETAILS' && (
                            <div className="space-y-6">
                                {/* Identity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Nombre *" {...register('name', { required: true })} error={errors.name?.message as string} placeholder='Ej: Laptop Dell XPS 15' disabled={isSaving} />
                                    <Input label="SKU / Código" {...register('sku')} error={errors.sku?.message as string} placeholder="SKU-AUTO" disabled={isSaving} className="font-mono text-xs" />
                                </div>

                                {/* Type & Unit */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-hubbi-dim uppercase">Tipo de Ítem</label>
                                        <Select
                                            value={selectedType}
                                            onChange={(val) => setValue('type', val as string, { shouldValidate: true })}
                                            options={[
                                                { value: 'product', label: 'Producto (Tangible)' },
                                                { value: 'service', label: 'Servicio (Intangible)' },
                                                { value: 'asset', label: 'Activo Fijo (Maquinaria/Equipo)' },
                                                { value: 'kit', label: 'Combo / Kit' },
                                            ]}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-hubbi-dim uppercase">Unidad Base *</label>
                                        <Select
                                            value={watchedBaseUnit || ''}
                                            onChange={(val) => setValue('base_unit_id', val as string, { shouldValidate: true })}
                                            options={uoms.map(u => ({ value: u.id, label: `${u.name} (${u.symbol})` }))}
                                            disabled={isSaving}
                                            placeholder="Seleccionar..."
                                            searchable
                                        />
                                    </div>
                                </div>

                                {/* Category / Group / Subgroup Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-hubbi-dim uppercase">Categoría *</label>
                                        <Select
                                            value={watchedCategoryId || ''}
                                            onChange={(val) => {
                                                setValue('category_id', val as string, { shouldValidate: true });
                                                // Reset group and subgroup when category changes
                                                setValue('group_id', '');
                                                // setValue('subgroup_id', '');
                                            }}
                                            options={categories.map(c => ({ value: c.id, label: c.name }))}
                                            disabled={isSaving}
                                            placeholder="Seleccionar..."
                                            searchable
                                        />
                                        {categories.length === 0 && (
                                            <p className="text-[10px] text-amber-500">No hay categorías. Créalas en Configuración.</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-hubbi-dim uppercase">Grupo (opcional)</label>
                                        <Select
                                            value={watchedGroupId || ''}
                                            onChange={(val) => {
                                                setValue('group_id', val as string);
                                                // Reset subgroup when group changes
                                                // setValue('subgroup_id', '');
                                            }}
                                            options={[
                                                { value: '', label: 'Sin grupo' },
                                                ...groups
                                                    .filter(g => !g.category_id || g.category_id === watchedCategoryId)
                                                    .map(g => ({ value: g.id, label: g.name }))
                                            ]}
                                            disabled={isSaving || !watchedCategoryId}
                                            placeholder="Seleccionar..."
                                        />
                                    </div>

                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-hubbi-dim uppercase">Descripción</label>
                                    <textarea {...register('description')} className="w-full bg-hubbi-input border border-hubbi-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hubbi-primary/50" rows={3} placeholder="Detalles técnicos..." />
                                </div>

                                {/* Properties Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                    {[
                                        { id: 'is_saleable', label: 'Vendible', desc: 'Aparece en Facturación' },
                                        { id: 'is_purchasable', label: 'Comprable', desc: 'Permite Órdenes de Compra' },
                                        { id: 'has_expiration', label: 'Vencimiento', desc: 'Controla Lotes y Fechas' },
                                        { id: 'is_tax_exempt', label: 'Exento IVA', desc: 'No calcula impuestos' }
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    ].map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-hubbi-muted/10 rounded-xl border border-hubbi-border">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-hubbi-text">{item.label}</span>
                                                <span className="text-[10px] text-hubbi-dim">{item.desc}</span>
                                            </div>
                                            <Toggle checked={watch(item.id)} onChange={val => setValue(item.id, val)} disabled={isSaving} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ATTRIBUTES --- */}
                        {activeTab === 'ATTRIBUTES' && (
                            <div className="space-y-6">
                                {Object.entries(groupedFields).map(([group, fields]) => (
                                    <div key={group} className="border border-hubbi-border rounded-xl p-5">
                                        <h3 className="text-sm font-bold text-hubbi-text border-b border-hubbi-border pb-2 mb-4 uppercase tracking-widest">{group}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {fields.map(field => (
                                                <div key={field.id}>
                                                    <label className="block text-xs font-bold text-hubbi-dim mb-1">{field.label}</label>
                                                    {field.type === 'text' && (
                                                        <input {...register(`attributes.${field.key_name}`)} className="w-full p-2 text-sm border rounded bg-transparent border-hubbi-border" />
                                                    )}
                                                    {field.type === 'number' && (
                                                        <input type="number" {...register(`attributes.${field.key_name}`)} className="w-full p-2 text-sm border rounded bg-transparent border-hubbi-border" />
                                                    )}
                                                    {field.type === 'boolean' && (
                                                        <Toggle checked={watch(`attributes.${field.key_name}`)} onChange={val => setValue(`attributes.${field.key_name}`, val)} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- TAB: PRICING --- */}
                        {activeTab === 'PRICING' && (
                            <div className="space-y-6">
                                {!isSaleable ? (
                                    <div className="p-8 text-center bg-hubbi-muted/30 rounded-lg border border-dashed border-hubbi-border">
                                        <Shield className="w-12 h-12 mx-auto text-hubbi-dim mb-3" />
                                        <h3 className="text-lg font-medium text-hubbi-text">Este ítem no es vendible</h3>
                                        <p className="text-sm text-hubbi-dim max-w-sm mx-auto mt-2">
                                            Para configurar precios, primero marca la opción "Vendible" en la pestaña de Detalles.
                                        </p>
                                        <Button variant="ghost" onClick={() => { setValue('is_saleable', true); setActiveTab('DETAILS'); }} className="mt-4 text-hubbi-primary">
                                            Activar Venta
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-hubbi-primary/5 border border-hubbi-primary/10 rounded-xl p-4 flex gap-6 items-center">
                                            <div className="p-3 bg-hubbi-muted/50 rounded-lg shadow-sm">
                                                <span className="block text-xs font-bold text-hubbi-dim uppercase">Precio Base (Unitario)</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-bold text-hubbi-primary">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register('price_base', { valueAsNumber: true })}
                                                        className="bg-transparent text-2xl font-black text-hubbi-text w-32 focus:outline-none focus:border-b border-hubbi-primary"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 text-sm text-hubbi-dim">
                                                <p>Este es el precio para la unidad base <strong>{uoms.find(u => u.id === watchedBaseUnit)?.name || '...'}</strong>.</p>
                                                <p>Las unidades adicionales se calcularán a partir de este valor por defecto.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-hubbi-text uppercase tracking-widest">Unidades Alternativas / Mayorista</h3>
                                                <Button variant="ghost" onClick={() => appendUom({ uom_id: '', conversion_factor: 1, sale_price: 0, barcode: '' })}>
                                                    <Plus size={16} className="mr-2" /> Agregar Presentación
                                                </Button>
                                            </div>

                                            <div className="rounded-xl border border-hubbi-border overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-hubbi-muted/10 text-hubbi-dim font-bold uppercase text-xs">
                                                        <tr>
                                                            <th className="px-4 py-3">Presentación</th>
                                                            <th className="px-4 py-3 w-32">Factor</th>
                                                            <th className="px-4 py-3 w-40">Precio Venta</th>
                                                            <th className="px-4 py-3">Código Barras</th>
                                                            <th className="px-4 py-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-hubbi-border">
                                                        {uomFields.map((field, index) => {
                                                            const currentUomValue = watch(`additional_uoms.${index}.uom_id`);
                                                            return (
                                                                <tr key={field.id} className="bg-hubbi-card group hover:bg-hubbi-muted/5">
                                                                    <td className="px-4 py-2">
                                                                        <Select
                                                                            options={uoms.filter(u => u.id !== watchedBaseUnit).map(u => ({ value: u.id, label: u.name }))}
                                                                            value={currentUomValue}
                                                                            onChange={(val) => setValue(`additional_uoms.${index}.uom_id`, val)}
                                                                            placeholder="Seleccionar..."
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            {...register(`additional_uoms.${index}.conversion_factor`, {
                                                                                valueAsNumber: true,
                                                                                onChange: (e) => {
                                                                                    // Auto-calc price suggestion
                                                                                    const factor = parseFloat(e.target.value) || 0;
                                                                                    const suggested = factor * (priceBase || 0);
                                                                                    setValue(`additional_uoms.${index}.sale_price`, parseFloat(suggested.toFixed(2)));
                                                                                }
                                                                            })}
                                                                            className="w-full bg-transparent border-b border-transparent focus:border-hubbi-primary focus:outline-none p-1 font-mono"
                                                                            placeholder="Ej: 12"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <div className="flex items-center">
                                                                            <span className="text-hubbi-dim mr-1">$</span>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                {...register(`additional_uoms.${index}.sale_price`, { valueAsNumber: true })}
                                                                                className="w-full bg-transparent font-bold focus:outline-none"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Barcode size={14} className="text-hubbi-dim" />
                                                                            <input
                                                                                {...register(`additional_uoms.${index}.barcode`)}
                                                                                className="w-full bg-transparent text-xs font-mono focus:outline-none"
                                                                                placeholder="Ean-13..."
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <button type="button" onClick={() => removeUom(index)} className="text-hubbi-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        }
                                                        )}
                                                        {uomFields.length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-4 py-8 text-center text-hubbi-dim italic">
                                                                    No hay presentaciones adicionales. Se venderá solo por unidad base.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-hubbi-border bg-hubbi-muted/10 flex justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleSubmit(onFormSubmit)} disabled={isSaving || hasWarehouses === false} className="px-10">
                            {isSaving ? 'Guardando...' : 'Crear Item'}
                        </Button>
                    </div>

                </div>
            </ActionLock>
        </div>
    );
};
