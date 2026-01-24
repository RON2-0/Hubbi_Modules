import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Package, Tag, Building2, Shield, DollarSign,
    Image as ImageIcon, Check, X
} from 'lucide-react';
import { clsx } from 'clsx';

// Core UI Components
import { Input, NumberInput } from '../../../../../Hubbi/src/components/ui/Input';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';
import { ActionLock } from '../../../../../Hubbi/src/components/ui/ActionLock';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

// Local UI Components
import { Toggle } from '../../components/ui/Toggle';

import { UnitOfMeasure } from '../../types/inventory';
import { productSchema, type ProductFormData } from '../../schemas/inventory';

interface ProductFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProductForm({ open, onClose, onSuccess }: ProductFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
    const [hasWarehouses, setHasWarehouses] = useState<boolean | null>(null);

    const context = typeof window !== 'undefined' ? window.hubbi?.getContext() : null;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<ProductFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        mode: 'onChange',
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
            category_id: null
        }
    });

    const watchedType = watch('type');
    const watchedBaseUnit = watch('base_unit_id');

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const results = await window.hubbi.db.query<UnitOfMeasure>(
                    "SELECT * FROM uoms WHERE is_active = TRUE",
                    [],
                    { moduleId: 'com.hubbi.inventory' }
                );
                setUoms(results);

                if (results.length > 0 && !watchedBaseUnit) {
                    setValue('base_unit_id', results[0].id);
                }

                const warehouseCheck = await window.hubbi.db.query(
                    "SELECT COUNT(*) as count FROM warehouses WHERE sub_hub_id = ?",
                    [context?.subHubId],
                    { moduleId: 'com.hubbi.inventory' }
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const count = (warehouseCheck[0] as any)?.count || 0;
                setHasWarehouses(count > 0);

            } catch (err) {
                console.error("Failed to load dependency data", err);
            }
        };
        if (open) loadDependencies();
    }, [open, context?.subHubId, setValue, watchedBaseUnit]);

    useEffect(() => {
        if (!open) {
            reset();
            setHasWarehouses(null);
        }
    }, [open, reset]);

    if (!open) return null;

    const onFormSubmit = async (data: ProductFormData) => {
        if (hasWarehouses === false) return;

        setIsSaving(true);
        try {
            const id = crypto.randomUUID();
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
                is_active: true
            }, { moduleId: 'com.hubbi.inventory' });

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

            <ActionLock locked={isSaving} loadingText="Guardando Producto...">
                <div
                    className="relative bg-hubbi-card border border-hubbi-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-hubbi-border flex items-center justify-between bg-hubbi-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-hubbi-primary/10 rounded-xl">
                                <Package className="text-hubbi-primary w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-hubbi-text">Nuevo Producto</h2>
                                <p className="text-sm text-hubbi-dim">Registra un nuevo ítem profesional en tu catálogo.</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-hubbi-muted rounded-full text-hubbi-dim hover:text-hubbi-text transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form Body */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">

                        {hasWarehouses === false && (
                            <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="p-2 bg-red-500 rounded-xl shadow-lg shadow-red-500/20">
                                    <Shield className="text-white w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-black text-red-500 uppercase tracking-wider">Acción Bloqueada</h4>
                                    <p className="text-sm text-red-500/80 leading-relaxed mt-1 font-medium">
                                        No puedes registrar productos en <strong className="text-red-600 bg-red-500/5 px-1 rounded">{context?.subHubName}</strong> sin bodegas configuradas.
                                    </p>
                                    <div className="mt-4">
                                        <button type="button" onClick={() => window.hubbi.navigate('/settings/warehouses')} className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20">
                                            Ir a configuración
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit(onFormSubmit as any)}
                            className={clsx("p-6 space-y-6 transition-all duration-500", hasWarehouses === false && "opacity-20 pointer-events-none grayscale blur-[1px]")}
                        >

                            {/* Identity Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-hubbi-primary" />
                                    <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-widest">Identidad</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Nombre del Producto *" {...register('name')} error={errors.name?.message} placeholder='Ej: Monitor Pro Display 27"' disabled={isSaving} />
                                    <Input label="SKU / Código" {...register('sku')} error={errors.sku?.message} placeholder="SKU-12345" disabled={isSaving} className="font-mono text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-hubbi-dim uppercase">Descripción</label>
                                    <textarea {...register('description')} className={clsx("w-full bg-hubbi-input border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hubbi-primary/50 text-hubbi-text transition-all min-h-[80px]", errors.description ? "border-red-500" : "border-hubbi-border hover:border-hubbi-dim")} placeholder="Detalles adicionales del producto..." disabled={isSaving} />
                                    {errors.description && <span className="text-xs text-red-500 font-medium">{errors.description.message}</span>}
                                </div>
                            </div>

                            {/* Classification & Values */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-hubbi-primary" />
                                        <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-widest">Clasificación</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-hubbi-dim uppercase">Tipo de Ítem</label>
                                        <Select
                                            value={watchedType}
                                            onChange={(val) => setValue('type', val as ProductFormData['type'], { shouldValidate: true })}
                                            options={[
                                                { value: 'product', label: 'Producto' },
                                                { value: 'service', label: 'Servicio' },
                                                { value: 'asset', label: 'Activo Fijo' },
                                                { value: 'kit', label: 'Combo / Kit' },
                                            ]}
                                            disabled={isSaving}
                                        />
                                        {errors.type && <span className="text-xs text-red-500 font-medium">{errors.type.message}</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-hubbi-dim uppercase">Unidad de Medida Base *</label>
                                        <Select
                                            value={watchedBaseUnit}
                                            onChange={(val) => setValue('base_unit_id', val as string, { shouldValidate: true })}
                                            options={uoms.map(u => ({ value: u.id, label: `${u.name} (${u.symbol})` }))}
                                            disabled={isSaving}
                                            placeholder="Seleccionar unidad..."
                                            searchable
                                        />
                                        {errors.base_unit_id && <span className="text-xs text-red-500 font-medium">{errors.base_unit_id.message}</span>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-hubbi-primary" />
                                        <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-widest">Valores</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <NumberInput label="Precio Venta" step="0.01" {...register('price_base', { valueAsNumber: true })} error={errors.price_base?.message} disabled={isSaving} startIcon={<DollarSign size={14} />} />
                                        <NumberInput label="Costo Inicial" step="0.01" {...register('cost_avg', { valueAsNumber: true })} error={errors.cost_avg?.message} disabled={isSaving} startIcon={<DollarSign size={14} />} />
                                    </div>
                                </div>
                            </div>

                            {/* Image URL */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-hubbi-primary" />
                                    <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-widest">Imagen</h3>
                                </div>
                                <Input {...register('photo_url')} error={errors.photo_url?.message} placeholder="https://ejemplo.com/foto.jpg" disabled={isSaving} className="font-mono text-xs" startIcon={<ImageIcon size={14} />} />
                            </div>

                            {/* Properties with Toggle standard */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-hubbi-primary" />
                                    <h3 className="text-xs font-bold text-hubbi-dim uppercase tracking-widest">Propiedades</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { id: 'is_saleable' as const, label: 'Ítem Vendible', description: 'Permite seleccionar este ítem en cotizaciones y facturas.' },
                                        { id: 'is_purchasable' as const, label: 'Ítem Comprable', description: 'Habilita la creación de órdenes de compra.' },
                                        { id: 'is_tax_exempt' as const, label: 'Exento de Impuestos', description: 'Ignora el cálculo de IVA para este ítem.' },
                                        { id: 'has_expiration' as const, label: 'Maneja Vencimiento', description: 'Activa el control de lotes y fechas de expiración.' },
                                        { id: 'has_warranty' as const, label: 'Aplica Garantía', description: 'Activa el seguimiento de certificados de garantía.' },
                                    ].map(item => {
                                        const isChecked = watch(item.id);
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-hubbi-muted/20 rounded-xl border border-hubbi-border">
                                                <div className="flex flex-col pr-4">
                                                    <span className="text-sm font-bold text-hubbi-text">{item.label}</span>
                                                    <span className="text-[10px] text-hubbi-dim leading-tight mt-0.5">{item.description}</span>
                                                </div>
                                                <Toggle
                                                    checked={isChecked}
                                                    onChange={(val) => setValue(item.id, val)}
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-hubbi-border bg-hubbi-muted/10 flex justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleSubmit(onFormSubmit as any)} disabled={isSaving || hasWarehouses === false} className="px-10">
                            {isSaving ? 'Guardando...' : 'Crear Producto'}
                        </Button>
                    </div>
                </div>
            </ActionLock>
        </div>
    );
}
