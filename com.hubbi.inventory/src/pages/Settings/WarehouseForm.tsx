import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Warehouse, Building2, MapPin, Phone } from 'lucide-react';

// Core UI Components
import { Input } from '../../../../../Hubbi/src/components/ui/Input';
import { Select } from '../../../../../Hubbi/src/components/ui/Select';
import { ActionLock } from '../../../../../Hubbi/src/components/ui/ActionLock';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';

// Local UI Components
import { Toggle } from '../../components/ui/Toggle';

import { InventoryWarehouse } from '../../types/inventory';
import { warehouseSchema, type WarehouseFormData } from '../../schemas/inventory';

interface BranchMember {
    user_id: string;
    full_name: string;
    username: string;
}

interface WarehouseFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: InventoryWarehouse | null;
}

export default function WarehouseForm({ open, onClose, onSuccess, initialData }: WarehouseFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [branches, setBranches] = useState<any[]>([]);
    const [branchMembers, setBranchMembers] = useState<BranchMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const context = window.hubbi.getContext();
    const hasBranchPermission = window.hubbi.hasPermission('subhub.select');

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<WarehouseFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(warehouseSchema) as any,
        defaultValues: {
            name: '',
            sub_hub_id: String(context?.subHubId || ''),
            address: '',
            phone: '',
            responsible_user_id: null,
            is_active: true
        }
    });

    const watchedBranchId = watch('sub_hub_id');
    const watchedActive = watch('is_active');
    const watchedResponsible = watch('responsible_user_id');

    // Load branches on open
    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    sub_hub_id: String(initialData.sub_hub_id),
                    // @ts-ignore - fields exist in DB but not in type yet
                    address: initialData.address || '',
                    // @ts-ignore
                    phone: initialData.phone || '',
                    responsible_user_id: initialData.responsible_user_id || null,
                    is_active: initialData.is_active !== false
                });
            } else {
                reset({
                    name: '',
                    sub_hub_id: String(context?.subHubId || ''),
                    address: '',
                    phone: '',
                    responsible_user_id: null,
                    is_active: true
                });
            }

            const loadBranches = async () => {
                try {
                    const b = await window.hubbi.subHubs.list();
                    setBranches(b);
                } catch (err) {
                    console.error("Failed to load branches", err);
                }
            };
            loadBranches();
        }
    }, [open, initialData, context?.subHubId, reset]);

    // Load members when branch changes
    useEffect(() => {
        const loadMembers = async () => {
            if (!watchedBranchId) {
                setBranchMembers([]);
                return;
            }

            setLoadingMembers(true);
            try {
                // Query members from core via SDK
                const members = await window.hubbi.members.list() as unknown as BranchMember[];
                // Filter by sub_hub_id (members that belong to the selected branch or are global)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filtered = members.filter((m: any) =>
                    !m.sub_hub_id || String(m.sub_hub_id) === String(watchedBranchId)
                );
                setBranchMembers(filtered);
            } catch (err) {
                console.error("Failed to load branch members", err);
                setBranchMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        };

        if (open) loadMembers();
    }, [watchedBranchId, open]);

    if (!open) return null;

    const onFormSubmit = async (data: WarehouseFormData) => {
        setIsSaving(true);
        try {
            if (initialData) {
                await window.hubbi.db.update('warehouses', initialData.id, {
                    name: data.name,
                    sub_hub_id: data.sub_hub_id,
                    address: data.address || null,
                    phone: data.phone || null,
                    responsible_user_id: data.responsible_user_id || null,
                    is_active: data.is_active
                }, { moduleId: 'com.hubbi.inventory' });
                window.hubbi.notify("Bodega actualizada", "success");
            } else {
                const id = crypto.randomUUID();
                await window.hubbi.db.insert('warehouses', {
                    id,
                    name: data.name,
                    sub_hub_id: data.sub_hub_id,
                    address: data.address || null,
                    phone: data.phone || null,
                    responsible_user_id: data.responsible_user_id || null,
                    is_active: data.is_active
                }, { moduleId: 'com.hubbi.inventory' });
                window.hubbi.notify("Bodega creada", "success");
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving warehouse", err);
            window.hubbi.notify("Error al guardar bodega", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => !isSaving && onClose()}></div>

            <ActionLock locked={isSaving} loadingText="Guardando Bodega...">
                <div
                    className="relative bg-hubbi-card border border-hubbi-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] min-w-[50vw] overflow-hidden animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-hubbi-border flex items-center justify-between bg-hubbi-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-hubbi-primary/10 rounded-xl">
                                <Warehouse className="text-hubbi-primary w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-hubbi-text">
                                {initialData ? 'Editar Bodega' : 'Nueva Bodega'}
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-hubbi-muted rounded-full text-hubbi-dim hover:text-hubbi-text transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit(onFormSubmit as any)} className="p-6 space-y-5 overflow-y-auto">
                        {/* Name */}
                        <Input
                            label="Nombre de Bodega *"
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="Ej: Bodega Central de Repuestos"
                            disabled={isSaving}
                            startIcon={<Warehouse size={14} />}
                            autoFocus
                        />

                        {/* Branch */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-hubbi-dim ml-1">Sucursal Asignada</label>
                            {hasBranchPermission ? (
                                <Select
                                    value={watchedBranchId}
                                    onChange={(val) => {
                                        setValue('sub_hub_id', val as string, { shouldValidate: true });
                                        // Reset responsible when branch changes
                                        setValue('responsible_user_id', null);
                                    }}
                                    options={branches.map(b => ({ value: String(b.id), label: b.name }))}
                                    disabled={isSaving}
                                    placeholder="Seleccionar sucursal..."
                                />
                            ) : (
                                <div className="w-full bg-hubbi-muted/30 border border-hubbi-border rounded-xl px-4 py-2.5 text-sm text-hubbi-text font-medium flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-hubbi-primary" />
                                        {context?.subHubName || 'Sucursal por defecto'}
                                    </div>
                                    <span className="text-[10px] text-hubbi-dim uppercase font-bold bg-hubbi-card px-2 py-0.5 rounded border border-hubbi-border">Fijo</span>
                                </div>
                            )}
                            {errors.sub_hub_id && <span className="text-xs text-red-500 font-medium">{errors.sub_hub_id.message}</span>}
                        </div>

                        {/* Address */}
                        <Input
                            label="Dirección"
                            {...register('address')}
                            error={errors.address?.message}
                            placeholder="Ej: Av. Principal #123, Zona Industrial"
                            disabled={isSaving}
                            startIcon={<MapPin size={14} />}
                        />

                        {/* Phone */}
                        <Input
                            label="Teléfono"
                            {...register('phone')}
                            error={errors.phone?.message}
                            placeholder="Ej: +503 2222-3333"
                            disabled={isSaving}
                            startIcon={<Phone size={14} />}
                        />

                        {/* Responsible User */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-hubbi-dim ml-1">Responsable</label>
                            <Select
                                value={watchedResponsible || ''}
                                onChange={(val) => setValue('responsible_user_id', val as string || null, { shouldValidate: true })}
                                options={[
                                    { value: '', label: '— Sin asignar —' },
                                    ...branchMembers.map(m => ({
                                        value: m.user_id,
                                        label: m.full_name,
                                        description: `@${m.username}`
                                    }))
                                ]}
                                disabled={isSaving || loadingMembers}
                                placeholder={loadingMembers ? "Cargando usuarios..." : "Seleccionar responsable..."}
                                searchable
                            />
                            {errors.responsible_user_id && <span className="text-xs text-red-500 font-medium">{errors.responsible_user_id.message}</span>}
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-hubbi-muted/20 rounded-xl border border-hubbi-border">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-hubbi-text">Estado de Actividad</span>
                                <span className="text-[10px] text-hubbi-dim">Permitir movimientos y stock.</span>
                            </div>
                            <Toggle
                                checked={watchedActive}
                                onChange={(val) => setValue('is_active', val)}
                                disabled={isSaving}
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="ghost" type="button" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                            <Button onClick={handleSubmit(onFormSubmit as any)} disabled={isSaving} className="px-8">
                                {isSaving ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Bodega')}
                            </Button>
                        </div>
                    </form>
                </div>
            </ActionLock>
        </div>
    );
}
