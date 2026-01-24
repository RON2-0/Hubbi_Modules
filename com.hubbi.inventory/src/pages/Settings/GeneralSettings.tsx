import { useState, useEffect } from 'react';
import { Save, RefreshCw, Briefcase, ShoppingBag, Stethoscope, Wrench, Building2, Check, AlertTriangle, RotateCcw } from 'lucide-react';

import { clsx } from 'clsx';
import { useInventorySettings } from '../../context/InventoryContext';
import { InventoryProfile, FeatureFlagKey } from '../../types/inventory';

const PROFILE_META: Record<InventoryProfile, { label: string; icon: any; description: string }> = {
    [InventoryProfile.GENERIC]: {
        label: 'Genérico',
        icon: Briefcase,
        description: 'Configuración estándar sin especialización.'
    },
    [InventoryProfile.RETAIL]: {
        label: 'Retail / Tienda',
        icon: ShoppingBag,
        description: 'Optimizado para ventas rápidas y rotación.'
    },
    [InventoryProfile.WORKSHOP]: {
        label: 'Taller',
        icon: Wrench,
        description: 'Gestión de servicios, repuestos y órdenes.'
    },
    [InventoryProfile.RESTAURANT]: {
        label: 'Restaurante',
        icon: Building2, // Chef icon not in default lucide set used here
        description: 'Control de ingredientes, recetas y perecederos.'
    },
    [InventoryProfile.PHARMACY]: {
        label: 'Farmacia',
        icon: Stethoscope,
        description: 'Control estricto de lotes y vencimientos.'
    }
};

export default function GeneralSettings() {
    // Store Hooks
    const profile = useInventorySettings(s => s.profile);
    const features = useInventorySettings(s => s.features);
    const overridden = useInventorySettings(s => s.overridden);
    const setProfile = useInventorySettings(s => s.setProfile);
    const toggleFeature = useInventorySettings(s => s.toggleFeature);
    const resetToDefaults = useInventorySettings(s => s.resetToProfileDefaults);

    // Ui State
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allDepartments, setAllDepartments] = useState<any[]>([]);

    // Store Hooks for Allowed Depts
    const allowedDepartments = useInventorySettings(s => s.allowedDepartments || []);
    const setAllowedDepartments = useInventorySettings(s => s.setAllowedDepartments);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                // Fetch settings from Cloud
                const stored = await window.hubbi.settings.getAll('com.hubbi.inventory');

                // Fetch Departments from Core
                const depts = await window.hubbi.departments.list();
                const context = window.hubbi.getContext();

                // Filter departments by current subhub
                const filteredDepts = context?.subHubId
                    ? depts.filter((d: any) => Number(d.sub_hub_id) === Number(context.subHubId))
                    : depts;

                setAllDepartments(filteredDepts);

                if (stored['allowedDepartments']) {
                    const ids = JSON.parse(stored['allowedDepartments']);
                    setAllowedDepartments(ids);
                }

            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save Profile
            await window.hubbi.settings.set('profile', profile, 'com.hubbi.inventory');

            // Save Allowed Departments
            await window.hubbi.settings.set('allowedDepartments', JSON.stringify(allowedDepartments), 'com.hubbi.inventory');

            // Save Features
            for (const [key, enabled] of Object.entries(features)) {
                await window.hubbi.settings.set(`feature_${key}`, String(enabled), 'com.hubbi.inventory');
            }

            window.hubbi.notify('Configuración guardada correctamente', 'success');
        } catch (err) {
            console.error(err);
            window.hubbi.notify('Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-hubbi-dim animate-pulse">Cargando perfil...</div>;

    const Toggle = ({ feature, label, description }: { feature: FeatureFlagKey, label: string, description: string }) => (
        <div className="flex items-center justify-between py-4 border-b border-hubbi-border last:border-0 group">
            <div>
                <div className="font-medium text-hubbi-text group-hover:text-hubbi-primary transition-colors">{label}</div>
                <div className="text-sm text-hubbi-dim">{description}</div>
            </div>
            <button
                onClick={() => toggleFeature(feature, !features[feature])}
                className={clsx(
                    "w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-hubbi-primary/20",
                    features[feature] ? "bg-hubbi-primary" : "bg-hubbi-muted"
                )}
            >
                <div className={clsx(
                    "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                    features[feature] ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                )} />
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">

            {/* Header / Intro */}
            <div>
                <h2 className="text-2xl font-bold text-hubbi-text">Configuración de Inventario</h2>
                <p className="text-hubbi-dim mt-1">Define el comportamiento del módulo mediante Perfiles de Negocio.</p>
            </div>

            {/* Profile Selector */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-hubbi-dim uppercase tracking-wider">Perfil de Negocio</h3>
                    {overridden && (
                        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                            <AlertTriangle size={12} />
                            <span>Personalizado</span>
                            <button onClick={resetToDefaults} className="underline hover:text-amber-600 ml-1 flex items-center gap-1">
                                <RotateCcw size={10} /> Restaurar
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(Object.keys(PROFILE_META) as InventoryProfile[]).map(key => {
                        const meta = PROFILE_META[key];
                        const isSelected = profile === key;
                        const Icon = meta.icon;

                        return (
                            <button
                                key={key}
                                onClick={() => setProfile(key)}
                                className={clsx(
                                    "p-3 rounded-xl border text-left transition-all relative flex flex-col gap-2",
                                    isSelected
                                        ? "border-hubbi-primary bg-hubbi-primary/5 text-hubbi-primary ring-1 ring-hubbi-primary shadow-sm"
                                        : "border-hubbi-border bg-hubbi-card hover:border-hubbi-dim/50 text-hubbi-text hover:bg-hubbi-background"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <Icon className={clsx("w-6 h-6", isSelected ? "text-hubbi-primary" : "text-hubbi-dim")} />
                                    {isSelected && <div className="bg-hubbi-primary text-white p-0.5 rounded-full"><Check size={10} /></div>}
                                </div>
                                <div>
                                    <span className="font-medium text-sm block">{meta.label}</span>
                                    <span className="text-xs text-hubbi-dim line-clamp-2 mt-0.5">{meta.description}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feature Flags */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-hubbi-dim uppercase tracking-wider">Capacidades Habilitadas</h3>
                <div className="bg-hubbi-card border border-hubbi-border rounded-xl px-6 divide-y divide-hubbi-border shadow-sm">

                    <Toggle
                        feature="expiration_dates"
                        label="Control de Vencimientos"
                        description="Requiere fecha de caducidad en entradas y salidas (FIFO/FEFO)."
                    />

                    <Toggle
                        feature="serial_tracking"
                        label="Números de Serie (S/N)"
                        description="Rastreo individual de ítems únicos."
                    />

                    <Toggle
                        feature="batch_tracking"
                        label="Lotes / Batches"
                        description="Agrupación de trazabilidad por lotes de fabricación."
                    />

                    <Toggle
                        feature="work_order_consumption"
                        label="Consumo por Órdenes"
                        description="Permite descontar inventario mediante órdenes de trabajo o recetas."
                    />

                    <Toggle
                        feature="asset_depreciation"
                        label="Gestión de Activos Fijos"
                        description="Habilita campos de depreciación y vida útil para bienes internos."
                    />

                    <Toggle
                        feature="kits_enabled"
                        label="Kits & Compuestos"
                        description="Permite crear productos hijos (BOM) dentro de un padre (ej. Canastas, Paquetes)."
                    />

                    <Toggle
                        feature="reservations_enabled"
                        label="Reservas de Stock"
                        description="Habilita el bloqueo de stock para Órdenes de Trabajo o Pedidos (Comprometido)."
                    />

                    <Toggle
                        feature="negative_stock_allowed"
                        label="Permitir Stock Negativo"
                        description="AUTORIZAR movimientos de salida sin stock suficiente (No recomendado)."
                    />

                </div>
            </div>

            {/* Department Access Control */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-hubbi-dim uppercase tracking-wider">Restricción de Acceso por Área</h3>
                    <div className="h-px flex-1 bg-hubbi-border"></div>
                </div>

                <div className="bg-hubbi-card border border-hubbi-border rounded-xl p-6 shadow-sm space-y-4">
                    <p className="text-sm text-hubbi-dim">
                        Selecciona los departamentos que tienen permiso para acceder a este módulo. Si no seleccionas ninguno, el acceso será **Universal** para todos los usuarios con el permiso `inventory.access`.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allDepartments.map((dept: any) => {
                            const isAllowed = allowedDepartments.includes(dept.id);
                            return (
                                <button
                                    key={dept.id}
                                    onClick={() => {
                                        const newDepts = isAllowed
                                            ? allowedDepartments.filter((id: number) => id !== dept.id)
                                            : [...allowedDepartments, dept.id];
                                        setAllowedDepartments(newDepts);
                                    }}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between gap-2",
                                        isAllowed
                                            ? "bg-hubbi-primary/10 border-hubbi-primary text-hubbi-primary"
                                            : "bg-hubbi-input/30 border-hubbi-border text-hubbi-dim hover:border-hubbi-dim/50"
                                    )}
                                >
                                    {dept.name}
                                    {isAllowed && <Check size={12} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Save Bar */}
            <div className="fixed bottom-6 right-6 z-10">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-hubbi-primary hover:bg-hubbi-primary-hover text-white px-6 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

        </div>
    );
}
